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

export function buildCategoriaAnalytics({ gastos, categorias, subcategorias, parcelas = [] }) {
  return categorias
    .map((categoria) => {
      const gastosCategoria = gastos.filter((gasto) => gasto.categoria_id === categoria.id);
      if (!gastosCategoria.length) return null;

      let pagos = 0;
      let pendentes = 0;

      for (const gasto of gastosCategoria) {
        if (parcelas.length > 0) {
          const p = parcelas.filter((parc) => parc.gasto_id === gasto.id);
          if (p.length > 0) {
            const pagosParcelas = p
              .filter((x) => x.status === 'pago')
              .reduce((s, x) => s + Number(x.valor || 0), 0);
            const totalParcelas = p.reduce((s, x) => s + Number(x.valor || 0), 0);
            let pendentesParcelas = p
              .filter((x) => x.status !== 'pago')
              .reduce((s, x) => s + Number(x.valor || 0), 0);
            if (totalParcelas === 0 && Number(gasto.valor_total_recorrencia || 0) > 0) {
              pendentesParcelas = Math.max(
                0,
                Number(gasto.valor_total_recorrencia || 0) - Number(gasto.valor_entrada || 0) - pagosParcelas
              );
            }
            pagos += pagosParcelas + Number(gasto.valor_entrada || 0);
            pendentes += pendentesParcelas;
            continue;
          }
        }
        if (gasto.status_pagamento === 'pago') pagos += Number(gasto.valor || 0);
        else if (['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento)) pendentes += Number(gasto.valor || 0);
        // considerar entrada como pago
        pagos += Number(gasto.valor_entrada || 0);
      }

      const total = pagos + pendentes;
      const categoriaSubcategorias = subcategorias
        .filter((subcategoria) => subcategoria.categoria_id === categoria.id)
        .map((subcategoria) => {
          const gastosSub = gastosCategoria.filter((gasto) => gasto.subcategoria_id === subcategoria.id);
          if (!gastosSub.length) return null;

          let subPagos = 0;
          let subPendentes = 0;

          for (const gasto of gastosSub) {
            if (parcelas.length > 0) {
              const p = parcelas.filter((parc) => parc.gasto_id === gasto.id);
              if (p.length > 0) {
                const pagosParcelas = p
                  .filter((x) => x.status === 'pago')
                  .reduce((s, x) => s + Number(x.valor || 0), 0);
                const totalParcelas = p.reduce((s, x) => s + Number(x.valor || 0), 0);
                let pendentesParcelas = p
                  .filter((x) => x.status !== 'pago')
                  .reduce((s, x) => s + Number(x.valor || 0), 0);
                if (totalParcelas === 0 && Number(gasto.valor_total_recorrencia || 0) > 0) {
                  pendentesParcelas = Math.max(
                    0,
                    Number(gasto.valor_total_recorrencia || 0) - Number(gasto.valor_entrada || 0) - pagosParcelas
                  );
                }
                subPagos += pagosParcelas + Number(gasto.valor_entrada || 0);
                subPendentes += pendentesParcelas;
                continue;
              }
            }
            if (gasto.status_pagamento === 'pago') subPagos += Number(gasto.valor || 0);
            else if (['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento)) subPendentes += Number(gasto.valor || 0);
            subPagos += Number(gasto.valor_entrada || 0);
          }

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

export function buildResumoObra({ obra, gastos, receitas, parcelas = [] }) {
  let gastosPagos = 0;
  let gastosAPagar = 0;

  for (const gasto of gastos) {
    if (parcelas.length > 0) {
      const p = parcelas.filter((parc) => parc.gasto_id === gasto.id);
      if (p.length > 0) {
        const pagosParcelas = p.filter((x) => x.status === 'pago').reduce((s, x) => s + Number(x.valor || 0), 0);
        const totalParcelas = p.reduce((s, x) => s + Number(x.valor || 0), 0);
        let pendentesParcelas = p.filter((x) => x.status !== 'pago').reduce((s, x) => s + Number(x.valor || 0), 0);
        if (totalParcelas === 0 && Number(gasto.valor_total_recorrencia || 0) > 0) {
          pendentesParcelas = Math.max(0, Number(gasto.valor_total_recorrencia || 0) - Number(gasto.valor_entrada || 0) - pagosParcelas);
        }
        gastosPagos += pagosParcelas + Number(gasto.valor_entrada || 0);
        gastosAPagar += pendentesParcelas;
        continue;
      }
    }
    if (gasto.status_pagamento === 'pago') gastosPagos += Number(gasto.valor || 0);
    else if (['pendente', 'programado', 'atrasado'].includes(gasto.status_pagamento)) gastosAPagar += Number(gasto.valor || 0);
    gastosPagos += Number(gasto.valor_entrada || 0);
  }

  const terreno = gastos.filter((gasto) => gasto.categoria_id === 'terreno');

  const calcSubset = (subset) => {
    let pago = 0; let pend = 0;
    for (const g of subset) {
      const p = parcelas.filter((parc) => parc.gasto_id === g.id);
      if (p.length > 0) {
        const pagosParcelas = p.filter((x) => x.status === 'pago').reduce((s, x) => s + Number(x.valor || 0), 0);
        const totalParcelas = p.reduce((s, x) => s + Number(x.valor || 0), 0);
        let pendentesParcelas = p.filter((x) => x.status !== 'pago').reduce((s, x) => s + Number(x.valor || 0), 0);
        if (totalParcelas === 0 && Number(g.valor_total_recorrencia || 0) > 0) {
          pendentesParcelas = Math.max(0, Number(g.valor_total_recorrencia || 0) - Number(g.valor_entrada || 0) - pagosParcelas);
        }
        pago += pagosParcelas + Number(g.valor_entrada || 0);
        pend += pendentesParcelas;
      } else {
        if (g.status_pagamento === 'pago') pago += Number(g.valor || 0);
        else if (['pendente', 'programado', 'atrasado'].includes(g.status_pagamento)) pend += Number(g.valor || 0);
        pago += Number(g.valor_entrada || 0);
      }
    }
    return { pago, pend };
  };

  const { pago: totalTerrenoPago, pend: totalTerrenoPendente } = calcSubset(terreno);

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