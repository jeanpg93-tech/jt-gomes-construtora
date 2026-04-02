import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarDays, Wand2 } from "lucide-react";

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
}) {
  if (!quantidadeParcelas) return null;

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
            <div key={parcela.numero_parcela} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Parcela {parcela.numero_parcela}</p>
                <p className="text-xs text-slate-500">R$ {Number(parcela.valor || valorParcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                <div className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center text-sm text-slate-600">
                  {parcela.status || 'programado'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}