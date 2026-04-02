export function formatCurrency(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseLocalDate(dateString) {
  if (!dateString) return null;
  const normalized = String(dateString).slice(0, 10);
  const [year, month, day] = normalized.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function filterByDate(items, dataInicio, dataFim, getDate) {
  if (!dataInicio || !dataFim) return items;
  const inicio = parseLocalDate(dataInicio);
  const fim = parseLocalDate(dataFim);
  if (!inicio || !fim) return items;

  return items.filter((item) => {
    const itemDate = parseLocalDate(getDate(item));
    if (!itemDate) return false;
    return itemDate >= inicio && itemDate <= fim;
  });
}

export function buildFiltersSummary({ obras, categorias, subcategorias, subcategorias2, etapas, status, dataInicio, dataFim, incluirGastosAdmin }) {
  return [
    { label: 'Período', value: dataInicio && dataFim ? `${dataInicio} até ${dataFim}` : 'Período completo' },
    { label: 'Status', value: status === 'pagos' ? 'Pagos' : status === 'nao_pagos' ? 'Não pagos' : 'Todos' },
    { label: 'Obras', value: obras.length ? obras.join(', ') : 'Todas' },
    { label: 'Categorias', value: categorias.length ? categorias.join(', ') : 'Todas' },
    { label: 'Subcategorias 1', value: subcategorias.length ? subcategorias.join(', ') : 'Todas' },
    { label: 'Subcategorias 2', value: subcategorias2.length ? subcategorias2.join(', ') : 'Todas' },
    { label: 'Etapas', value: etapas.length ? etapas.join(', ') : 'Todas' },
    { label: 'Gastos administrativos', value: incluirGastosAdmin ? 'Incluídos' : 'Não incluídos' },
  ];
}

export function buildCategoriaAnalytics({ gastos, categorias, subcategorias }) {
  return categorias
    .map((categoria) => {
      const gastosCategoria = gastos.filter((gasto) => gasto.categoria_id === categoria.id);
      if (!gastosCategoria.length) return null;

      const pagos = gastosCategoria
        .filter((gasto) => gasto.status_pagamento === 'pago')
        .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

      const pendentes = gastosCategoria
        .filter((gasto) => ['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento))
        .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

      const total = pagos + pendentes;
      const categoriaSubcategorias = subcategorias
        .map((subcategoria) => {
          const gastosSub = gastosCategoria.filter((gasto) => gasto.subcategoria_id === subcategoria.id);
          if (!gastosSub.length) return null;

          const subPagos = gastosSub
            .filter((gasto) => gasto.status_pagamento === 'pago')
            .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

          const subPendentes = gastosSub
            .filter((gasto) => ['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento))
            .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

          return {
            id: subcategoria.id,
            nome: subcategoria.nome,
            pago: subPagos,
            pendente: subPendentes,
            total: subPagos + subPendentes,
            quantidade: gastosSub.length,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.total - a.total);

      return {
        id: categoria.id,
        nome: categoria.nome,
        pago: pagos,
        pendente: pendentes,
        total,
        quantidade: gastosCategoria.length,
        media: total / gastosCategoria.length,
        subcategorias: categoriaSubcategorias,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total);
}

export function buildResumoObra({ obra, gastos, receitas }) {
  const gastosPagos = gastos
    .filter((gasto) => gasto.status_pagamento === 'pago')
    .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

  const gastosAPagar = gastos
    .filter((gasto) => ['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento))
    .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

  const terreno = gastos.filter((gasto) => gasto.categoria_id === 'terreno');

  const totalTerrenoPago = terreno
    .filter((gasto) => gasto.status_pagamento === 'pago')
    .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

  const totalTerrenoPendente = terreno
    .filter((gasto) => ['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento))
    .reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0);

  const totalReceitas = receitas.reduce((sum, receita) => sum + Number(receita.valor || 0), 0);
  const totalDespesas = gastosPagos + gastosAPagar;
  const valorVendaProjetado = Number(obra?.valor_venda_projetado || 0);

  return {
    gastosPagos,
    gastosAPagar,
    totalDespesas,
    totalReceitas,
    totalTerrenoPago,
    totalTerrenoPendente,
    lucroEstimadoAtual: valorVendaProjetado - totalDespesas,
  };
}