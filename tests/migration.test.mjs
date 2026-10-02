import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const reader = '00000000-0000-4000-8000-000000000002';
const pending = '00000000-0000-4000-8000-000000000003';
const approvedLater = '00000000-0000-4000-8000-000000000004';
const migration = readFileSync(new URL('../supabase/migrations/202610020001_base44_to_supabase.sql', import.meta.url), 'utf8');
const seed = execFileSync('python3', ['-c', 'import sys; sys.path.insert(0,"migracao-supabase"); import import_data; print(import_data.build_sql(import_data.load_and_validate()))'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
async function as(role, id, fn) {
  await db.exec(`SET ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id || '']);
  try { return await fn(); }
  finally { await db.exec('RESET ROLE'); }
}
before(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;
    GRANT USAGE ON SCHEMA auth,storage TO anon,authenticated;
    GRANT SELECT,INSERT,DELETE ON storage.objects TO authenticated;
  `);
  await db.exec(migration);
  await db.exec(seed).catch(error => { throw new Error(error.message); });
  for (const [id, email] of [[admin,'admin@example.test'],[reader,'reader@example.test'],[pending,'pending@example.test']]) {
    await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES ($1,$2,$3)', [id,email,{ role:'admin', active:true, full_name:'Test User' }]);
  }
  await db.query("UPDATE profiles SET role='admin',active=true WHERE id=$1", [admin]);
  await db.query("UPDATE profiles SET active=true,permissoes_gastos='leitura' WHERE id=$1", [reader]);
});
after(async () => { await db.close(); });

test('imports all original IDs, metadata, relationships and exact financial totals', async () => {
  const { rows } = await db.query('SELECT count(*)::int AS count, sum(valor)::text AS total FROM gastos');
  assert.deepEqual(rows[0], { count:263,total:'1932049.27' });
  for (const [file,table] of [['obra','obras'],['gasto','gastos'],['contrato','contratos'],['categoria_gasto','categorias_gasto'],['subcategoria_gasto','subcategorias_gasto']]) {
    const records=JSON.parse(readFileSync(new URL(`../migracao-supabase/backup/${file}.json`,import.meta.url),'utf8'));
    const actual=(await db.query(`SELECT * FROM ${table}`)).rows;
    assert.deepEqual(actual.map(r=>r.id).sort(),records.map(r=>r.id).sort());
    for(const original of records){
      const row=actual.find(r=>r.id===original.id);
      for(const [key,value] of Object.entries(original)){
        if(value !== null && (key.endsWith('_date') || key.startsWith('data_') || key === 'data')) assert.equal(new Date(row[key]).toISOString(),new Date(value).toISOString());
        else if(typeof value==='number') assert.equal(Number(row[key]),value);
        else assert.deepEqual(row[key],value,`${table}.${key}`);
      }
    }
  }
});
test('repeating the import preserves counts and does not overwrite records', async () => {
  await db.exec(seed).catch(error => { throw new Error(error.message); });
  assert.equal((await db.query('SELECT count(*)::int n FROM gastos')).rows[0].n,263);
});
test('conflicting existing data cancels the complete import transaction', async () => {
  const id=(await db.query('SELECT id FROM gastos ORDER BY id LIMIT 1')).rows[0].id;
  await db.query('UPDATE gastos SET valor=valor+1 WHERE id=$1',[id]);
  await assert.rejects(db.exec(seed).catch(error => { throw new Error(error.message); }),/Conflito/);
  await db.exec('ROLLBACK');
  await db.query('UPDATE gastos SET valor=valor-1 WHERE id=$1',[id]);
  assert.equal((await db.query('SELECT sum(valor)::text total FROM gastos')).rows[0].total,'1932049.27');
});
test('anonymous visitors cannot read financial data or grant permissions through an access request', async () => {
  await as('anon',null, async()=>{
    await assert.rejects(db.query('SELECT * FROM gastos'),/permission denied/);
    const payload={nome_completo:'Applicant',email:'applicant@example.test',status:'aprovado',permissoes_gastos:'total',role:'admin'};
    const {rows}=await db.query('SELECT public.request_access($1::jsonb) AS id',[JSON.stringify(payload)]);
    assert.ok(rows[0].id);
    await assert.rejects(db.query('SELECT * FROM solicitacoes_cadastro'),/permission denied/);
    await assert.rejects(db.query("SELECT public.update_my_profile('{\"role\":\"admin\"}')"),/permission denied/);
  });
  const request=(await db.query("SELECT status,permissoes_gastos FROM solicitacoes_cadastro WHERE email='applicant@example.test'")).rows[0];
  assert.deepEqual(request,{status:'pendente',permissoes_gastos:'leitura'});
});
test('signup ignores privileged metadata; pending users cannot read business data', async()=>{
  const profile=(await db.query('SELECT role,active FROM profiles WHERE id=$1',[pending])).rows[0];
  assert.deepEqual(profile,{role:'user',active:false});
  await as('authenticated',pending,async()=>{
    assert.equal((await db.query('SELECT * FROM gastos')).rows.length,0);
    assert.equal((await db.query('SELECT * FROM profiles')).rows.length,1);
    assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,0);
    await assert.rejects(db.query("INSERT INTO obras(nome,endereco) VALUES ('Denied','Denied')"),/row-level security/);
  });
});
test('read-only members see authorized records but cannot modify, delete or self-promote',async()=>{
  await as('authenticated',reader,async()=>{
    assert.equal((await db.query('SELECT count(*)::int n FROM gastos')).rows[0].n,263);
    assert.equal((await db.query('UPDATE gastos SET valor=0 RETURNING id')).rows.length,0);
    assert.equal((await db.query('DELETE FROM gastos RETURNING id')).rows.length,0);
    assert.equal((await db.query("UPDATE profiles SET role='admin' WHERE id=$1 RETURNING id",[reader])).rows.length,0);
    await assert.rejects(db.query("SELECT public.update_my_profile('{\"role\":\"admin\"}')"),/Sem permissão/);
  });
});
test('admin approval activates existing profiles and future signups; denial revokes access',async()=>{
  await as('authenticated',admin,async()=>{
    await db.query("INSERT INTO solicitacoes_cadastro(nome_completo,email) VALUES ('Pending','pending@example.test')");
    await db.query("UPDATE solicitacoes_cadastro SET status='aprovado',permissoes_gastos='edicao' WHERE email='pending@example.test'");
    await db.query("UPDATE solicitacoes_cadastro SET status='aprovado' WHERE email='applicant@example.test'");
  });
  assert.equal((await db.query('SELECT active FROM profiles WHERE id=$1',[pending])).rows[0].active,true);
  await db.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)',[approvedLater,'applicant@example.test']);
  assert.equal((await db.query('SELECT active FROM profiles WHERE id=$1',[approvedLater])).rows[0].active,true);
  await as('authenticated',admin,async()=>{await db.query("UPDATE solicitacoes_cadastro SET status='negado' WHERE email='pending@example.test'");});
  assert.equal((await db.query('SELECT active FROM profiles WHERE id=$1',[pending])).rows[0].active,false);
});
test('edit permission permits writes but total permission is required for deletes',async()=>{
  await db.query("UPDATE profiles SET permissoes_gastos='edicao' WHERE id=$1",[reader]);
  const id=(await db.query('SELECT id FROM gastos LIMIT 1')).rows[0].id;
  await as('authenticated',reader,async()=>{
    assert.equal((await db.query("UPDATE gastos SET observacoes='permission test' WHERE id=$1 RETURNING id",[id])).rows.length,1);
    assert.equal((await db.query('DELETE FROM gastos WHERE id=$1 RETURNING id',[id])).rows.length,0);
  });
});
test('configuration RPC updates safe fields and ignores role and permissions even for an allowed editor',async()=>{
  await db.query("UPDATE profiles SET permissoes_configuracoes='edicao' WHERE id=$1",[reader]);
  await as('authenticated',reader,async()=>{
    await db.query('SELECT public.update_my_profile($1::jsonb)',[JSON.stringify({workspace_name:'Company',role:'admin',active:false,permissoes_gastos:'total'})]);
  });
  const row=(await db.query('SELECT workspace_name,role,active,permissoes_gastos FROM profiles WHERE id=$1',[reader])).rows[0];
  assert.deepEqual(row,{workspace_name:'Company',role:'user',active:true,permissoes_gastos:'edicao'});
});
test('private storage denies anonymous uploads and prevents writing into another user folder',async()=>{
  assert.equal((await db.query("SELECT public FROM storage.buckets WHERE id='documentos'")).rows[0].public,false);
  await as('authenticated',reader,async()=>{
    await assert.rejects(db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('documentos',$1)",[`${admin}/secret.pdf`]),/row-level security/);
    await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES ('documentos',$1)",[`${reader}/contract.pdf`]);
  });
});
