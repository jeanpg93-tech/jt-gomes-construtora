import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calendar, Clock, CheckCircle, ChevronDown, ChevronUp, CheckCircle2, Repeat } from "lucide-react";
import { format, differenceInDays, isBefore, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

// Converte string "YYYY-MM-DD" para Date local correta (sem problemas de timezone)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function PagamentosVencimento({ gastos, parcelas = [], onEditGasto, onGastoUpdated }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [markingAsPaid, setMarkingAsPaid] = useState({});
  const [paymentDates, setPaymentDates] = useState({});
  const hoje = new Date();

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Não é mais necessário addOneDay — o bug de timezone foi corrigido

  const handleMarkAsPaid = async (item, e) => {
    e.stopPropagation();
    const itemId = `${item.tipo}-${item.id}`;
    const dataPagamento = paymentDates[itemId] || getTodayDate();
    
    setMarkingAsPaid(prev => ({ ...prev, [itemId]: true }));
    
    try {
      if (item.tipo === 'parcela') {
        await base44.entities.ParcelaGasto.update(item.id, {
          status: 'pago',
          data_pagamento: dataPagamento
        });
      } else {
        await base44.entities.Gasto.update(item.id, {
          status_pagamento: 'pago',
          data_pagamento: dataPagamento
        });
      }
      
      if (onGastoUpdated) {
        onGastoUpdated();
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('Erro ao marcar como pago. Tente novamente.');
    } finally {
      setMarkingAsPaid(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDateChange = (itemId, date, e) => {
    e.stopPropagation();
    setPaymentDates(prev => ({ ...prev, [itemId]: date }));
  };

  const gastosComVencimento = gastos
    .filter(gasto => gasto.data_vencimento && gasto.status_pagamento !== 'pago')
    .map((gasto) => ({
      ...gasto,
      tipo: 'gasto',
      titulo: gasto.descricao,
      status_exibicao: gasto.status_pagamento,
      valor_exibicao: Number(gasto.valor || 0),
      data_vencimento_exibicao: gasto.data_vencimento,
    }));

  const parcelasComVencimento = parcelas
    .filter((parcela) => parcela.data_vencimento && parcela.status !== 'pago')
    .map((parcela) => {
      const gastoPai = gastos.find((gasto) => gasto.id === parcela.gasto_id);
      if (!gastoPai) return null;

      return {
        ...parcela,
        tipo: 'parcela',
        titulo: gastoPai.descricao,
        obra_id: gastoPai.obra_id,
        gasto_pai: gastoPai,
        status_exibicao: parcela.status,
        valor_exibicao: Number(parcela.valor || 0),
        data_vencimento_exibicao: parcela.data_vencimento,
      };
    })
    .filter(Boolean);

  const pagamentosComVencimento = [...gastosComVencimento, ...parcelasComVencimento];

  const hojeSemHora = startOfDay(hoje);

  const pagamentosVencidos = pagamentosComVencimento.filter(item => {
    const dataVencimento = parseLocalDate(item.data_vencimento_exibicao);
    if (!dataVencimento) return false;
    return isBefore(dataVencimento, hojeSemHora) && !isToday(dataVencimento);
  });

  const pagamentosVencendoHoje = pagamentosComVencimento.filter(item => {
    const dataVencimento = parseLocalDate(item.data_vencimento_exibicao);
    if (!dataVencimento) return false;
    return isToday(dataVencimento);
  });

  const pagamentosProximos10Dias = pagamentosComVencimento.filter(item => {
    const dataVencimento = parseLocalDate(item.data_vencimento_exibicao);
    if (!dataVencimento) return false;
    const diasParaVencimento = differenceInDays(dataVencimento, hojeSemHora);
    return diasParaVencimento > 0 && diasParaVencimento <= 10;
  });

  const totalPagamentos = pagamentosVencidos.length + pagamentosVencendoHoje.length + pagamentosProximos10Dias.length;
  const valorTotalPagamentos = [...pagamentosVencidos, ...pagamentosVencendoHoje, ...pagamentosProximos10Dias].reduce(
    (total, item) => total + (item.valor_exibicao || 0),
    0
  );

  if (totalPagamentos === 0) {
    return null;
  }

  const renderGastoItem = (item, tipo) => {
    const cores = {
      vencido: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
      hoje: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
      proximo: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
    };

    const gastoBase = item.tipo === 'parcela' ? item.gasto_pai : item;
    const valorTotalRecorrencia = Number(gastoBase?.valor_total_recorrencia || 0);
    const valorEntrada = Number(gastoBase?.valor_entrada || 0);
    const valorPagoParcelas = parcelas
      .filter((parcela) => parcela.gasto_id === gastoBase?.id && parcela.status === 'pago')
      .reduce((sum, parcela) => sum + Number(parcela.valor || 0), 0);
    const valorPagoAteAgora = valorEntrada + valorPagoParcelas;
    const valorRestante = gastoBase?.eh_recorrente && valorTotalRecorrencia > 0
      ? Math.max(valorTotalRecorrencia - valorPagoAteAgora, 0)
      : null;
    const itemId = `${item.tipo}-${item.id}`;

    return (
      <div 
        key={itemId} 
        className={`p-3 rounded-lg border transition-colors duration-200 ${cores[tipo]} flex items-start gap-3`}
      >
        <div className="flex-1 cursor-pointer" onClick={() => onEditGasto && onEditGasto(gastoBase)}>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{item.titulo}</h4>
            {item.tipo === 'parcela' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                <Repeat className="w-3 h-3" />
                Parcela {item.numero_parcela}
              </span>
            )}
          </div>
          <p className="text-sm opacity-75">
            Valor: R$ {Number(item.valor_exibicao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {valorRestante !== null && (
            <p className="text-sm font-semibold mt-1">
              Falta pagar: R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Calendar className="w-3 h-3" />
            {format(parseLocalDate(item.data_vencimento_exibicao), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Input
            type="date"
            value={paymentDates[itemId] || getTodayDate()}
            onChange={(e) => handleDateChange(itemId, e.target.value, e)}
            onClick={(e) => e.stopPropagation()}
            className="h-8 text-xs w-[130px]"
          />
          <Button
            size="sm"
            onClick={(e) => handleMarkAsPaid(item, e)}
            disabled={markingAsPaid[itemId]}
            className="bg-green-600 hover:bg-green-700 h-8 text-xs whitespace-nowrap"
          >
            {markingAsPaid[itemId] ? (
              'Marcando...'
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Pago
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Pagamentos em Vencimento
              <span className="text-sm font-normal text-slate-500">
                ({totalPagamentos} {totalPagamentos === 1 ? 'pagamento' : 'pagamentos'})
              </span>
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Valor total: <span className="font-semibold text-slate-800">R$ {valorTotalPagamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
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
          {pagamentosVencidos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-red-600">
                  Vencidos ({pagamentosVencidos.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pagamentosVencidos.map(item => renderGastoItem(item, 'vencido'))}
              </div>
            </div>
          )}

          {/* Vencendo Hoje */}
          {pagamentosVencendoHoje.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-orange-600">
                  Vencendo Hoje ({pagamentosVencendoHoje.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pagamentosVencendoHoje.map(item => renderGastoItem(item, 'hoje'))}
              </div>
            </div>
          )}

          {/* Próximos 10 dias */}
          {pagamentosProximos10Dias.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-blue-600">
                  Próximos 10 dias ({pagamentosProximos10Dias.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pagamentosProximos10Dias.map(item => renderGastoItem(item, 'proximo'))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}