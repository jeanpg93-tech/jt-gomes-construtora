import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Building2,
  DollarSign,
  Edit,
  User,
  Clock,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

export default function ReceitaCard({ receita, obras, categorias, onEdit, getTipoLabel, isSelectMode, isSelected, onSelectToggle }) {
  const obra = obras.find(o => o.id === receita.obra_id);
  const categoria = categorias.find(c => c.id === receita.categoria_id);

  const getTipoColor = (tipo) => {
    const colors = {
      venda: 'bg-green-100 text-green-800 border-green-200',
      sinal: 'bg-blue-100 text-blue-800 border-blue-200',
      parcela: 'bg-purple-100 text-purple-800 border-purple-200',
      financiamento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aluguel: 'bg-pink-100 text-pink-800 border-pink-200',
      outros: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[tipo] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      prevista: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      recebida: 'bg-green-100 text-green-800 border-green-200',
      atrasada: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      prevista: 'Prevista',
      recebida: 'Recebida',
      atrasada: 'Atrasada'
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

  return (
    <Card
      className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md h-full relative ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
      onClick={isSelectMode ? onSelectToggle : undefined}
    >
      {isSelectMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectToggle}
          className="absolute top-4 right-4 z-10 bg-white h-5 w-5"
          aria-label="Selecionar receita"
        />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className={`${getTipoColor(receita.tipo)} border`}>
                {getTipoLabel(receita.tipo)}
              </Badge>
              {categoria && (
                <Badge variant="outline">{categoria.nome}</Badge>
              )}
              <Badge className={`${getStatusColor(receita.status)} border`}>
                {getStatusLabel(receita.status)}
              </Badge>
              {getOrigemBadge(receita.origem_registro || 'web')}
            </div>
            <h3 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
              {receita.descricao}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="w-4 h-4" />
              {obra?.nome || 'Obra não encontrada'}
            </div>
          </div>
          {!isSelectMode && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(receita); }}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Valor e Data */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              R$ {receita.valor.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            {format(new Date(receita.data), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        </div>

        {/* Data de Vencimento */}
        {receita.data_vencimento && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>Vence em: {format(new Date(receita.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
        )}

        {/* Cliente */}
        {receita.cliente && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            {receita.cliente}
          </div>
        )}

        {/* Forma de Pagamento */}
        {receita.forma_pagamento && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CreditCard className="w-4 h-4" />
            {getFormaPagamentoLabel(receita.forma_pagamento)}
          </div>
        )}

        {/* Observações */}
        {receita.observacoes && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm text-slate-700">{receita.observacoes}</p>
          </div>
        )}

        {/* Informações de Registro */}
        {(receita.created_by || receita.created_date) && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              {receita.created_by && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Por: {receita.created_by}</span>
                </div>
              )}
              {receita.created_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(receita.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}