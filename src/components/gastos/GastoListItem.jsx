import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, DollarSign, Edit, User, CreditCard, FileText, Download, GitBranch, Repeat, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrencyBRL, getResumoRecorrencia } from "@/utils/gastosRecorrencia";

export default function GastoListItem({ gasto, parcelas, obras, categorias, subcategorias, etapasObra, fornecedores, onEdit, onDuplicate, isSelectMode, isSelected, onSelectToggle }) {

  const fornecedor = fornecedores?.find(f => f.id === gasto.fornecedor_id);
  
  const obra = obras?.find(o => o.id === gasto.obra_id);
  const categoria = categorias?.find(c => c.id === gasto.categoria_id);
  const subcategoria = subcategorias?.find(s => s.id === gasto.subcategoria_id);
  
  const etapasDoGasto = (gasto.etapa_obra_ids || [])
    .map(etapaId => etapasObra?.find(e => e.id === etapaId))
    .filter(Boolean);

  const resumoRecorrencia = getResumoRecorrencia(gasto, parcelas);
  const derivedStatus = resumoRecorrencia ? (Number(resumoRecorrencia.pendenteTotal || 0) > 0 ? 'programado' : 'pago') : gasto.status_pagamento;

  const getStatusColor = (status) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      programado: 'bg-blue-100 text-blue-800 border-blue-200',
      pago: 'bg-green-100 text-green-800 border-green-200',
      atrasado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      programado: 'Programado',
      pago: 'Pago',
      atrasado: 'Atrasado'
    };
    return labels[status] || status;
  };

  const getFormaPagamentoLabel = (forma) => {
    const labels = {
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      transferencia: 'Transferência',
      boleto: 'Boleto',
      financiamento: 'Financiamento',
      pix: 'PIX'
    };
    return labels[forma] || forma;
  };

  const getFileName = (url) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const getOrigemBadge = (origem) => {
    if (origem === 'whatsapp') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 border flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Web
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div 
      className={`p-4 hover:bg-slate-50 transition-colors ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={isSelectMode ? onSelectToggle : undefined}
    >
      <div className="flex items-start gap-4">
        {isSelectMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelectToggle}
            className="mt-1"
            aria-label="Selecionar gasto"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              {gasto.numero_sequencial && (
                <Badge className="bg-slate-700 text-white font-mono text-xs mb-2">
                  {gasto.numero_sequencial}
                </Badge>
              )}
              <h3 className="font-semibold text-slate-800 mb-2">{gasto.descricao}</h3>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline">{categoria?.nome || 'Sem categoria'}</Badge>
                {subcategoria && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">
                    {subcategoria.nome}
                  </Badge>
                )}
                <Badge className={`${getStatusColor(derivedStatus)} border`}>
                  {getStatusLabel(derivedStatus)}
                </Badge>
                {resumoRecorrencia && (
                  <Badge className="bg-violet-100 text-violet-800 border-violet-200 border flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Recorrente
                  </Badge>
                )}
                {getOrigemBadge(gasto.origem_registro || 'web')}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrencyBRL(gasto.valor || 0)}
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(gasto.data_pagamento || gasto.data)}
                </div>
              </div>
              
              {!isSelectMode && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDuplicate(gasto); 
                    }}
                    title="Duplicar gasto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(gasto); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4" />
              {obra?.nome || 'Obra não encontrada'}
            </div>
            
            {fornecedor && ( 
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4" />
                {fornecedor.nome} 
              </div>
            )}
            
            {gasto.forma_pagamento && (
              <div className="flex items-center gap-2 text-slate-600">
                <CreditCard className="w-4 h-4" />
                {getFormaPagamentoLabel(gasto.forma_pagamento)}
              </div>
            )}
          </div>

          {resumoRecorrencia && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Valor total</p>
                  <p className="font-bold text-violet-800">{formatCurrencyBRL(resumoRecorrencia.total)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Pago</p>
                  <p className="font-bold text-green-700">{formatCurrencyBRL(resumoRecorrencia.pagoTotal)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Pendente</p>
                  <p className="font-bold text-amber-700">{formatCurrencyBRL(resumoRecorrencia.pendenteTotal)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Próxima parcela</p>
                  {resumoRecorrencia.proximaParcela ? (
                    <div>
                      <p className="font-bold text-slate-800">{formatCurrencyBRL(resumoRecorrencia.proximaParcela.valor)}</p>
                      <p className="text-slate-600 flex items-center gap-1"><Clock3 className="w-3 h-3" /> {formatDate(resumoRecorrencia.proximaData)}</p>
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-600">Tudo pago</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {gasto.arquivo_anexo && (
            <div className="flex items-center gap-2 mt-2"> {/* Moved outside the grid */}
              <FileText className="w-4 h-4 text-slate-600" />
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(gasto.arquivo_anexo, '_blank');
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                {getFileName(gasto.arquivo_anexo)}
              </Button>
            </div>
          )}

          {/* Etapas da Obra */}
          {etapasDoGasto.length > 0 && (
            <div className="mt-3 bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-3 h-3 text-purple-600" />
                <p className="text-xs text-purple-700 font-medium">Etapas:</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {etapasDoGasto.map(etapa => (
                  <Badge key={etapa.id} variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                    {etapa.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {gasto.observacoes && (
            <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
              {gasto.observacoes}
            </div>
          )}

          {/* Informações de Registro */}
          {(gasto.created_by || gasto.created_date) && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {gasto.created_by && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Por: {gasto.created_by}</span>
                  </div>
                )}
                {gasto.created_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(gasto.created_date)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}