import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function MediaGastosCategoria({ gastos, categorias }) {
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const dadosAnalise = categorias
        .map(cat => {
            const gastosDaCategoria = gastos.filter(g => g.categoria_id === cat.id);
            if (gastosDaCategoria.length === 0) return null;

            const totalCategoria = gastosDaCategoria.reduce((sum, g) => sum + g.valor, 0);
            const numeroTransacoes = gastosDaCategoria.length;
            const mediaPorTransacao = totalCategoria / numeroTransacoes;

            return {
                id: cat.id,
                nome: cat.nome,
                total: totalCategoria,
                transacoes: numeroTransacoes,
                media: mediaPorTransacao
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.total - a.total);

    return (
        <Card className="shadow-lg border-0 h-full">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    Análise de Gastos por Categoria
                </CardTitle>
            </CardHeader>
            <CardContent>
                {dadosAnalise.length > 0 ? (
                    <div className="space-y-4">
                        {dadosAnalise.map(cat => (
                            <div key={cat.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-2">{cat.nome}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">Total Gasto</p>
                                        <p className="font-medium text-red-600">{formatCurrency(cat.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Nº Transações</p>
                                        <p className="font-medium">{cat.transacoes}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Média / Transação</p>
                                        <p className="font-medium">{formatCurrency(cat.media)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-500">
                        Nenhum gasto para analisar no período.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}