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

  return (
    <Card className="border-blue-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          Agenda das parcelas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-blue-50 p-3 border border-blue-100">
            <div className="text-sm"><span className="text-slate-500">Valor total:</span> <span className="font-semibold">R$ {formatCurrency(valorTotal)}</span></div>
            <div className="text-sm"><span className="text-slate-500">Entrada:</span> <span className="font-semibold">R$ {formatCurrency(valorEntrada)}</span></div>
            <div className="text-sm"><span className="text-slate-500">Parcela:</span> <span className="font-semibold">R$ {formatCurrency(valorParcela)}</span></div>
          </div>
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
            <Button type="button" variant="outline" className="w-full" onClick={onGenerate}>
              <Wand2 className="w-4 h-4 mr-2" />
              Gerar datas
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {parcelas.map((parcela) => (
            <div key={parcela.numero_parcela} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Parcela {parcela.numero_parcela}</p>
                <p className="text-xs text-slate-500">R$ {formatCurrency(parcela.valor || valorParcela || 0)}</p>
              </div>
              <div className="space-y-1">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={parcela.data_vencimento || ''}
                  onChange={(e) => onUpdateParcela(parcela.numero_parcela, 'data_vencimento', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={parcela.status || 'programado'} onValueChange={(value) => onUpdateParcela(parcela.numero_parcela, 'status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programado">programado</SelectItem>
                    <SelectItem value="pendente">pendente</SelectItem>
                    <SelectItem value="pago">pago</SelectItem>
                    <SelectItem value="atrasado">atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Data pag.</Label>
                <Input
                  type="date"
                  value={parcela.data_pagamento || ''}
                  onChange={(e) => onUpdateParcela(parcela.numero_parcela, 'data_pagamento', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}