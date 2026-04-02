export const formatCurrencyBRL = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

export const getResumoRecorrencia = (gasto, parcelas = []) => {
  if (!gasto?.eh_recorrente) return null;

  const total = Number(gasto.valor_total_recorrencia || gasto.valor || 0);
  const entrada = Number(gasto.valor_entrada || 0);
  const parcelasValidas = parcelas.filter((item) => item?.gasto_id === gasto.id);
  const pagoParcelas = parcelasValidas
    .filter((item) => item.status === 'pago')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const pagoTotal = entrada + pagoParcelas;
  const pendenteTotal = Math.max(total - pagoTotal, 0);

  const proximasParcelas = parcelasValidas
    .filter((item) => item.status !== 'pago' && item.data_vencimento)
    .sort((a, b) => String(a.data_vencimento).localeCompare(String(b.data_vencimento)));

  const proximaParcela = proximasParcelas[0] || null;

  return {
    total,
    entrada,
    pagoTotal,
    pendenteTotal,
    quantidadeParcelas: parcelasValidas.length || Number(gasto.quantidade_parcelas || 0),
    proximaParcela,
    proximaData: normalizeDate(proximaParcela?.data_vencimento),
  };
};