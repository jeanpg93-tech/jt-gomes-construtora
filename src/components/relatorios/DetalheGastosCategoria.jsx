import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/relatorios";
import { ChevronDown } from "lucide-react";

export default function DetalheGastosCategoria({ categorias = [], gastos = [], parcelas = [] }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  if (!categorias.length) return null;

  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800">Detalhamento por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800">{categoria.nome}</h3>
                <p className="text-sm text-slate-500">{categoria.quantidade} lançamentos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-100 text-red-700">Pago: {formatCurrency(categoria.pago)}</Badge>
                <Badge className="bg-amber-100 text-amber-700">Pendente: {formatCurrency(categoria.pendente)}</Badge>
                <Badge className="bg-blue-100 text-blue-700">Total: {formatCurrency(categoria.total)}</Badge>
              </div>
            </div>
            {categoria.subcategorias.length > 0 && (
              <div className="space-y-2">
                {categoria.subcategorias.map((subcategoria) => {
                  const key = `${categoria.id}:${subcategoria.id}`;
                  const itens = (gastos || []).filter(
                    (g) => g.categoria_id === categoria.id && g.subcategoria_id === subcategoria.id
                  );
                  return (
                    <div key={subcategoria.id} className="rounded-lg bg-slate-50 text-sm">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="w-full px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded[key] ? "rotate-180" : ""}`} />
                          <span className="font-medium text-slate-700">{subcategoria.nome}</span>
                          <span className="text-xs text-slate-500">• {itens.length} lançamentos</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-slate-600">
                          <span>Pago: {formatCurrency(subcategoria.pago)}</span>
                          <span>Pendente: {formatCurrency(subcategoria.pendente)}</span>
                          <span>Total: {formatCurrency(subcategoria.total)}</span>
                        </div>
                      </button>

                      {expanded[key] && (
                        <div className="px-3 pb-3 pt-1 space-y-1">
                          {itens.length === 0 ? (
                            <p className="text-xs text-slate-500 pl-6">Sem lançamentos</p>
                          ) : (
                            itens.map((item) => {
                              const parcelasDoGasto = (parcelas || []).filter((p) => p.gasto_id === item.id);
                              let pago = 0;
                              let pendente = 0;
                              if (parcelasDoGasto.length > 0) {
                                const pagosParcelas = parcelasDoGasto
                                  .filter((x) => x.status === "pago")
                                  .reduce((s, x) => s + Number(x.valor || 0), 0);
                                const pendParcelas = parcelasDoGasto
                                  .filter((x) => x.status !== "pago")
                                  .reduce((s, x) => s + Number(x.valor || 0), 0);
                                pago = pagosParcelas + Number(item.valor_entrada || 0);
                                pendente = pendParcelas;
                              } else {
                                pago = (item.status_pagamento === "pago" ? Number(item.valor || 0) : 0) + Number(item.valor_entrada || 0);
                                pendente = item.status_pagamento === "pago" ? 0 : Number(item.valor || 0);
                              }
                              const total = pago + pendente;
                              return (
                                <div key={item.id} className="pl-6 pr-2 py-1 flex items-center justify-between border-l border-slate-200">
                                  <div className="text-slate-700 truncate pr-2">{item.descricao || "(Sem descrição)"}</div>
                                  <div className="flex gap-3 text-xs text-slate-600 whitespace-nowrap">
                                    <span>Pago: {formatCurrency(pago)}</span>
                                    <span>Pendente: {formatCurrency(pendente)}</span>
                                    <span>Total: {formatCurrency(total)}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}