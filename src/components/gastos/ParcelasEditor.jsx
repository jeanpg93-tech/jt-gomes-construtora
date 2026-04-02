import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarDays, Wand2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ParcelasEditor({
  parcelas,
  quantidadeParcelas,
  onChangeQuantidade,
  onGenerate,
  onUpdateParcela,
  diaFixo,
  onChangeDiaFixo,
  dataInicio,
  onChangeDataInicio,
  valorParcela,
  valorTotal,
  valorEntrada,
}) {
  if (!quantidadeParcelas) return null;

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalParcelas = parcelas.reduce((sum, parcela) => sum + (Number(parcela.valor || 0) || 0), 0);
  const saldoEsperado = Math.max(Number(valorTotal || 0) - Number(valorEntrada || 0), 0);
  const diferencaParcelas = saldoEsperado - totalParcelas;

  return (
    <Card className="border-blue-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Agenda das parcelas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Valor total</p>
            <p className="mt-1 text-xl font-bold text-slate-900">R$ {formatCurrency(valorTotal)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Entrada</p>
            <p className="mt-1 text-xl font-bold text-slate-900">R$ {formatCurrency(valorEntrada)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Valor previsto por parcela</p>
            <p className="mt-1 text-xl font-bold text-slate-900">R$ {formatCurrency(valorParcela)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Total das parcelas</p>
            <p className="mt-1 text-xl font-bold text-slate-900">R$ {formatCurrency(totalParcelas)}</p>
          </div>
        </div>

        {Math.abs(diferencaParcelas) > 0.009 && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${diferencaParcelas > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
            {diferencaParcelas > 0
              ? `Atenção: ainda faltam R$ ${formatCurrency(diferencaParcelas)} para fechar o valor total das parcelas.`
              : `Atenção: as parcelas estão R$ ${formatCurrency(Math.abs(diferencaParcelas))} acima do valor previsto.`}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[120px,1fr,1fr,200px] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-2">
            <Label>Qtd. parcelas</Label>
            <Input type="number" min="1" value={quantidadeParcelas} onChange={(e) => onChangeQuantidade(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input type="date" value={dataInicio} onChange={(e) => onChangeDataInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dia fixo mensal</Label>
            <Input type="number" min="1" max="31" value={diaFixo} onChange={(e) => onChangeDiaFixo(e.target.value)} placeholder="Ex: 15" />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full h-10 bg-white" onClick={onGenerate}>
              <Wand2 className="w-4 h-4 mr-2" />
              Gerar datas
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {parcelas.map((parcela) => (
            <div key={parcela.numero_parcela} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[140px,160px,1fr,1fr,1fr] gap-4 items-end">
                <div>
                  <p className="text-base font-semibold text-slate-900">Parcela {parcela.numero_parcela}</p>
                  <p className="mt-1 text-sm text-slate-500">R$ {formatCurrency(parcela.valor || 0)}</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={parcela.valor ?? valorParcela ?? 0}
                    onChange={(e) => onUpdateParcela(parcela.numero_parcela, 'valor', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={parcela.data_vencimento || ''}
                    onChange={(e) => onUpdateParcela(parcela.numero_parcela, 'data_vencimento', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Status</Label>
                  <Select value={parcela.status || 'programado'} onValueChange={(value) => onUpdateParcela(parcela.numero_parcela, 'status', value)}>
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programado">Programado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Data de pagamento</Label>
                  <Input
                    type="date"
                    value={parcela.data_pagamento || ''}
                    onChange={(e) => onUpdateParcela(parcela.numero_parcela, 'data_pagamento', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}