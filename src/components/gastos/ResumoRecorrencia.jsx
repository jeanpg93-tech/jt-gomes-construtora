import React from "react";
import { Badge } from "@/components/ui/badge";

export default function ResumoRecorrencia({ gasto, parcelas = [] }) {
  if (!gasto?.eh_recorrente) return null;

  const total = Number(gasto.valor_total_recorrencia || 0);
  const entrada = Number(gasto.valor_entrada || 0);
  const pagoParcelas = parcelas
    .filter((item) => item.status === 'pago')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const pagoTotal = entrada + pagoParcelas;
  const restante = Math.max(total - pagoTotal, 0);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Recorrente</Badge>
        <Badge variant="outline">{parcelas.length || gasto.quantidade_parcelas || 0} parcelas</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div><span className="text-slate-500">Total:</span> <span className="font-semibold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div><span className="text-slate-500">Pago:</span> <span className="font-semibold text-green-700">R$ {pagoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div><span className="text-slate-500">Falta:</span> <span className="font-semibold text-red-700">R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      </div>
    </div>
  );
}