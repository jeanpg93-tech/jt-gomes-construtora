import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagamentosVencimento({ gastos, onEditGasto }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hoje = new Date();
  
  // Filtrar gastos com base na data de vencimento e status
  const gastosComVencimento = gastos.filter(gasto => 
    gasto.data_vencimento && 
    gasto.status_pagamento !== 'pago' // Apenas gastos não pagos
  );

  const gastosVencidos = gastosComVencimento.filter(gasto => {
    const dataVencimento = new Date(gasto.data_vencimento);
    return isBefore(dataVencimento, hoje) && !isToday(dataVencimento);
  });

  const gastosVencendoHoje = gastosComVencimento.filter(gasto => {
    const dataVencimento = new Date(gasto.data_vencimento);
    return isToday(dataVencimento);
  });

  const gastosProximos10Dias = gastosComVencimento.filter(gasto => {
    const dataVencimento = new Date(gasto.data_vencimento);
    const diasParaVencimento = differenceInDays(dataVencimento, hoje);
    return diasParaVencimento > 0 && diasParaVencimento <= 10;
  });

  const totalPagamentos = gastosVencidos.length + gastosVencendoHoje.length + gastosProximos10Dias.length;

  if (totalPagamentos === 0) {
    return null;
  }

  const renderGastoItem = (gasto, tipo) => {
    const cores = {
      vencido: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
      hoje: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
      proximo: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
    };

    return (
      <div 
        key={gasto.id} 
        className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${cores[tipo]}`}
        onClick={() => onEditGasto && onEditGasto(gasto)}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium">{gasto.descricao}</h4>
            <p className="text-sm opacity-75">
              R$ {gasto.valor.toLocaleString('pt-BR')}
              {gasto.fornecedor && ` • ${gasto.fornecedor}`}
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(gasto.data_vencimento), 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Pagamentos em Vencimento
            <span className="text-sm font-normal text-slate-500">
              ({totalPagamentos} {totalPagamentos === 1 ? 'pagamento' : 'pagamentos'})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-700"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Vencidos */}
          {gastosVencidos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-red-600">
                  Vencidos ({gastosVencidos.length})
                </h3>
              </div>
              <div className="space-y-2">
                {gastosVencidos.map(gasto => renderGastoItem(gasto, 'vencido'))}
              </div>
            </div>
          )}

          {/* Vencendo Hoje */}
          {gastosVencendoHoje.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-orange-600">
                  Vencendo Hoje ({gastosVencendoHoje.length})
                </h3>
              </div>
              <div className="space-y-2">
                {gastosVencendoHoje.map(gasto => renderGastoItem(gasto, 'hoje'))}
              </div>
            </div>
          )}

          {/* Próximos 10 dias */}
          {gastosProximos10Dias.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-blue-600">
                  Próximos 10 dias ({gastosProximos10Dias.length})
                </h3>
              </div>
              <div className="space-y-2">
                {gastosProximos10Dias.map(gasto => renderGastoItem(gasto, 'proximo'))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}