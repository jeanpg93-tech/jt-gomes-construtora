import { createClient } from '@supabase/supabase-js';
import { createEntityClient } from '../src/api/entityClient.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function fixture(records, responseError) {
  const calls=[];
  const client=createClient('https://example.supabase.co','test-public-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(url,options)=>{
      const u=new URL(url);calls.push({url:u,options});
      if(responseError)return new Response(JSON.stringify(responseError),{status:403,headers:{'Content-Type':'application/json'}});
      let rows=records;
      if(u.searchParams.has('obra_id'))rows=rows.filter(r=>'eq.'+r.obra_id===u.searchParams.get('obra_id'));
      const offset=Number(u.searchParams.get('offset')||0);const limit=Number(u.searchParams.get('limit')||500);
      if(!options.method || options.method==='GET')rows=rows.slice(offset,offset+limit);
      else rows=[JSON.parse(options.body)];
      if(options.headers.get('Accept')?.includes('vnd.pgrst.object'))rows=rows[0];
      return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
    }},
  });
  return {entity:createEntityClient(()=>client,'gastos'),calls};
}
test('financial listings paginate beyond the Supabase row cap with stable ordering',async()=>{
  const records=Array.from({length:1203},(_,i)=>({id:String(i),valor:10,obra_id:'obra'}));
  const {entity,calls}=fixture(records);
  const result=await entity.list('-created_date');
  assert.equal(result.length,1203);assert.equal(result.reduce((s,r)=>s+r.valor,0),12030);
  assert.deepEqual(calls.map(c=>c.url.searchParams.get('offset')),['0','500','1000']);
  assert.ok(calls.every(c=>c.url.searchParams.get('order')==='created_date.desc.nullslast,id.asc'));
});
test('filters, limits and offsets preserve the requested record window',async()=>{
  const records=Array.from({length:1100},(_,i)=>({id:String(i),obra_id:'obra'}));
  const {entity,calls}=fixture(records);
  const result=await entity.filter({obra_id:'obra'},'-data',510,20);
  assert.equal(result.length,510);assert.equal(result[0].id,'20');assert.equal(result.at(-1).id,'529');
  assert.ok(calls.every(c=>c.url.searchParams.get('obra_id')==='eq.obra'));
});
test('CRUD errors propagate instead of reporting false success',async()=>{
  const {entity}=fixture([],{message:'permission denied',code:'42501'});
  await assert.rejects(entity.list(),e=>e.code==='42501');
  await assert.rejects(entity.delete('expense'),e=>e.code==='42501');
});
test('updates preserve IDs and server metadata and normalize empty optional form fields',async()=>{
  const {entity,calls}=fixture([]);
  await entity.update('existing',{id:'other',created_date:'old',updated_date:'old',created_by:'other',fornecedor_id:'',data_pagamento:'',descricao:'Payment'});
  const request=calls[0];
  assert.equal(request.url.searchParams.get('id'),'eq.existing');
  assert.deepEqual(JSON.parse(request.options.body),{fornecedor_id:null,data_pagamento:null,descricao:'Payment'});
});
test('zero-length requests do not query, and invalid pagination fails explicitly',async()=>{
  const {entity,calls}=fixture([]);
  assert.deepEqual(await entity.list('-data',0),[]);assert.equal(calls.length,0);
  await assert.rejects(entity.list('-data',-1),/Paginação/);
});
