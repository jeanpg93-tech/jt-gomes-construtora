import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function ParcelasBaixaCard({ grupos, onUpdated }) {
  const [datas, setDatas] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  if (!grupos.length) return null;

  const hoje = new Date().toISOString().slice(0, 10);

  const marcarPago = async (parcela) => {
    const dataPagamento = datas[parcela.id] || hoje;
    setLoadingId(parcela.id);
    await base44.entities.ParcelaGasto.update(parcela.id, {
      status: 'pago',
      data_pagamento: dataPagamento,
    });
    setLoadingId(null);
    onUpdated();
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Baixa de parcelas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grupos.map(({ gasto, parcelas, restante }) => (
          <div key={gasto.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-slate-800">{gasto.descricao}</h3>
              <p className="text-sm text-slate-500">Falta pagar: R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2">
              {parcelas.map((parcela) => (
                <div key={parcela.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-sm text-slate-800">Parcela {parcela.numero_parcela} • R$ {Number(parcela.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-500">Vencimento: {parcela.data_vencimento ? format(new Date(parcela.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido'}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Input
                      type="date"
                      value={datas[parcela.id] || hoje}
                      onChange={(e) => setDatas((prev) => ({ ...prev, [parcela.id]: e.target.value }))}
                      className="w-full sm:w-[150px]"
                    />
                    <Button onClick={() => marcarPago(parcela)} disabled={loadingId === parcela.id} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {loadingId === parcela.id ? 'Baixando...' : 'Dar baixa'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}