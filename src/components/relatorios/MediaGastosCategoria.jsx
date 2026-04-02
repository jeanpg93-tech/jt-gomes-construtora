import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { formatCurrency } from '@/utils/relatorios';

export default function MediaGastosCategoria({ categorias = [] }) {
  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-600" />
          Análise de Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categorias.length > 0 ? (
          <div className="space-y-4">
            {categorias.map((cat) => (
              <div key={cat.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">{cat.nome}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Total</p>
                    <p className="font-medium text-slate-900">{formatCurrency(cat.total)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Pago</p>
                    <p className="font-medium text-red-600">{formatCurrency(cat.pago)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Pendente</p>
                    <p className="font-medium text-amber-600">{formatCurrency(cat.pendente)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Média / Lançamento</p>
                    <p className="font-medium">{formatCurrency(cat.media)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500">Nenhum gasto para analisar no período.</div>
        )}
      </CardContent>
    </Card>
  );
}