// Keep the existing screens' CRUD contract while using Supabase and database RLS.
export const entityTables = Object.freeze({
  Obra: 'obras', Gasto: 'gastos', CategoriaGasto: 'categorias_gasto',
  SubcategoriaGasto: 'subcategorias_gasto', SubcategoriaGasto2: 'subcategorias_gasto2',
  Receita: 'receitas', CategoriaReceita: 'categorias_receita', Contrato: 'contratos',
  Fornecedor: 'fornecedores', Pessoa: 'pessoas', EtapaObra: 'etapas_obra',
  Material: 'materiais', MaterialEtapa: 'materiais_etapas', ParcelaGasto: 'parcelas_gasto',
  GastoAdministrativo: 'gastos_administrativos', CategoriaGastoAdministrativo: 'categorias_gasto_administrativo',
  Recibo: 'recibos', SolicitacaoCadastro: 'solicitacoes_cadastro', User: 'profiles',
});

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export function cleanPayload(payload, { creating = false } = {}) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) =>
    value !== undefined && !['created_date', 'updated_date', 'created_by', 'is_sample'].includes(key)
    && (creating || key !== 'id')
  ).map(([key, value]) => [key, value === '' ? null : value]));
}

export function createEntityClient(getClient, table) {
  async function read(filters = {}, sort = '-created_date', limit, skip = 0) {
    if (!Number.isInteger(skip) || skip < 0 || (limit !== undefined && (!Number.isInteger(limit) || limit < 0))) {
      throw new Error('Paginação inválida.');
    }
    if (limit === 0) return [];
    const rows = [];
    // Supabase caps a single response at 1,000 rows; paginate to avoid truncating financial totals.
    const batchSize = 500;
    while (limit === undefined || rows.length < limit) {
      const size = Math.min(batchSize, limit === undefined ? batchSize : limit - rows.length);
      let query = getClient().from(table).select('*');
      for (const [field, value] of Object.entries(filters)) {
        if (value === undefined) continue;
        query = value === null ? query.is(field, null) : Array.isArray(value) ? query.in(field, value) : query.eq(field, value);
      }
      if (sort) {
        const field = sort.replace(/^-/, '');
        query = query.order(field, { ascending: !sort.startsWith('-'), nullsFirst: false });
        if (field !== 'id') query = query.order('id', { ascending: true });
      } else query = query.order('id', { ascending: true });
      const batch = unwrap(await query.range(skip + rows.length, skip + rows.length + size - 1)) || [];
      rows.push(...batch);
      if (batch.length < size) break;
    }
    return rows;
  }
  return {
    list: (sort, limit, skip) => read({}, sort, limit, skip),
    filter: read,
    get: async id => unwrap(await getClient().from(table).select('*').eq('id', id).single()),
    create: async payload => unwrap(await getClient().from(table).insert(cleanPayload(payload, { creating: true })).select().single()),
    bulkCreate: async payloads => unwrap(await getClient().from(table).insert(payloads.map(p => cleanPayload(p, { creating: true }))).select()),
    update: async (id, payload) => unwrap(await getClient().from(table).update(cleanPayload(payload)).eq('id', id).select().single()),
    delete: async id => {
      // Returning the deleted ID distinguishes a denied/nonexistent record from a successful delete.
      return unwrap(await getClient().from(table).delete().eq('id', id).select('id').single());
    },
  };
}
