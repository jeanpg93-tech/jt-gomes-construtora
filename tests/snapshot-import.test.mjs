import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createTestDatabase } from './helpers/supabase-db.mjs';

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'jt-snapshot-test-'));
  const names = ['Obra', 'CategoriaGasto', 'SubcategoriaGasto', 'SubcategoriaGasto2', 'CategoriaReceita', 'Fornecedor', 'Pessoa', 'EtapaObra', 'Material', 'MaterialEtapa', 'CategoriaGastoAdministrativo', 'Gasto', 'Receita', 'Contrato', 'ParcelaGasto', 'GastoAdministrativo', 'Recibo', 'SolicitacaoCadastro', 'User'];
  const data = Object.fromEntries(names.map(name => [name, []]));
  data.Obra = [{ id: 'work', nome: 'Synthetic work', endereco: 'Synthetic street' }];
  data.CategoriaGasto = [{ id: 'category', nome: 'Synthetic category' }];
  data.Fornecedor = [{ id: 'supplier', nome: 'Legacy supplier', representante_estado_civil: '', data_nascimento: '', created_by_id: 'original-user', is_sample: false }];
  data.EtapaObra = [{ id: 'step', nome: 'Synthetic step' }];
  data.Gasto = [{ id: 'expense', obra_id: 'work', categoria_id: 'category', fornecedor_id: 'supplier', etapa_obra_ids: ['step'], descricao: "Quote ' and \\ backslash $migration_check$", valor: 100.10, data: '2026-01-01' }];
  data.ParcelaGasto = [{ id: 'valid', gasto_id: 'expense', numero_parcela: 1, valor: 10.11 }, { id: 'orphan', gasto_id: 'deleted-expense', numero_parcela: 1, valor: 11.11 }];
  data.CategoriaGastoAdministrativo = [{ id: 'admin-category', nome: 'Synthetic admin category' }];
  data.GastoAdministrativo = [{ id: 'admin-expense', descricao: 'Synthetic admin expense', categoria_id: 'admin-category', valor: 5.15, data: '2026-01-01' }];
  data.User = [{ id: 'base-user', email: 'synthetic@example.test', role: 'admin' }];
  const manifest = { app_id: '68e9048368479eb97b630e22', entities: {} };
  for (const [entity, rows] of Object.entries(data)) {
    const content = JSON.stringify(rows);
    writeFileSync(join(directory, entity + '.json'), content);
    manifest.entities[entity] = { file: entity + '.json', count: rows.length, sha256: createHash('sha256').update(content).digest('hex') };
  }
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest));
  return { directory, data, manifest };
}
function prepare(directory, allow = true) {
  const code = 'import sys; sys.path.insert(0,"migracao-supabase"); import import_snapshot as m; print(m.build_sql(m.prepare(sys.argv[1]),allow_reconciliation=sys.argv[2]=="yes"))';
  return execFileSync('python3', ['-c', code, directory, allow ? 'yes' : 'no'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 });
}

test('complete import preserves legacy data and archives orphan installments and Auth profiles without activating them', async () => {
  const f = fixture(); const db = await createTestDatabase();
  try {
    await db.exec(prepare(f.directory));
    assert.deepEqual((await db.query('SELECT tipo FROM fornecedores')).rows, [{ tipo: null }]);
    assert.deepEqual((await db.query('SELECT representante_estado_civil, data_nascimento FROM fornecedores')).rows, [{ representante_estado_civil: null, data_nascimento: null }]);
    assert.deepEqual((await db.query('SELECT id FROM parcelas_gasto')).rows, [{ id: 'valid' }]);
    assert.equal((await db.query('SELECT sum(valor)::text total FROM gastos')).rows[0].total, '100.10');
    assert.equal((await db.query('SELECT sum(valor)::text total FROM gastos_administrativos')).rows[0].total, '5.15');
    assert.equal((await db.query('SELECT descricao FROM gastos')).rows[0].descricao, f.data.Gasto[0].descricao);
    const rows = (await db.query('SELECT entity,raw_record,disposition FROM migration_private.source_records')).rows;
    for (const [entity, originals] of Object.entries(f.data)) {
      for (const original of originals) assert.deepEqual(rows.find(row => row.entity === entity && row.raw_record.id === original.id).raw_record, original);
    }
    assert.equal(rows.find(row => row.raw_record.id === 'orphan').disposition, 'reconcile');
    assert.equal(rows.find(row => row.entity === 'User').disposition, 'auth_pending');
    assert.equal((await db.query('SELECT count(*)::int n FROM auth.users')).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int n FROM profiles')).rows[0].n, 0);
  } finally { await db.close(); rmSync(f.directory, { recursive: true }); }
});

test('repeating a compatible snapshot does not duplicate records; conflicts roll back every insert', async () => {
  const f = fixture(); const db = await createTestDatabase();
  try {
    const sql = prepare(f.directory); await db.exec(sql); await db.exec(sql);
    const count = (await db.query('SELECT count(*)::int n FROM migration_private.source_records')).rows[0].n;
    assert.equal(count, Object.values(f.data).flat().length);
    await db.exec("UPDATE gastos SET valor=200 WHERE id='expense'; DELETE FROM gastos_administrativos;");
    await assert.rejects(db.exec(sql), /Conflito/); await db.exec('ROLLBACK');
    assert.equal((await db.query('SELECT valor::text total FROM gastos')).rows[0].total, '200.00');
    assert.equal((await db.query('SELECT count(*)::int n FROM gastos_administrativos')).rows[0].n, 0);
  } finally { await db.close(); rmSync(f.directory, { recursive: true }); }
});

test('private archive is inaccessible to both anonymous visitors and signed-in users', async () => {
  const f = fixture(); const db = await createTestDatabase();
  try {
    await db.exec(prepare(f.directory));
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query('SELECT * FROM migration_private.source_records'), /permission denied/);
      await assert.rejects(db.query('SELECT migration_private.assert_record(true)'), /permission denied/);
      await db.exec('RESET ROLE');
    }
  } finally { await db.close(); rmSync(f.directory, { recursive: true }); }
});

test('strict preparation blocks unresolved references and detects edited snapshots', () => {
  const f = fixture();
  try {
    assert.throws(() => prepare(f.directory, false), error => /sem conciliação/.test(error.stderr.toString()));
    writeFileSync(join(f.directory, 'Gasto.json'), '[]');
    assert.throws(() => prepare(f.directory), error => /checksum/.test(error.stderr.toString()));
  } finally { rmSync(f.directory, { recursive: true }); }
});
