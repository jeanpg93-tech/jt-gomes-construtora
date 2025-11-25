
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioObra({ obra, obras, gastos, receitas, contratos, workspaceInfo }) {
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Se múltiplas obras, mostrar resumo geral
  if (obras && obras.length > 1) {
    const gastosPagos = gastos
      .filter(g => g.status_pagamento === 'pago')
      .reduce((sum, g) => sum + (g.valor || 0), 0);

    const gastosAPagar = gastos
      .filter(g => ['programado', 'atrasado', 'pendente'].includes(g.status_pagamento))
      .reduce((sum, g) => sum + (g.valor || 0), 0);
    
    const totalGastosComprometidos = gastosPagos + gastosAPagar;
    const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
    
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Resumo Geral - {obras.length} Obras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">Obras Selecionadas</h3>
            <div className="space-y-2">
              {obras.map(o => (
                <div key={o.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-medium text-slate-700">{o.nome}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Resumo Financeiro Consolidado</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              <div>
                <p className="text-slate-500">Gastos Pagos</p>
                <p className="font-semibold text-red-600">{formatCurrency(gastosPagos)}</p>
              </div>
              <div>
                <p className="text-slate-500">Gastos a Pagar</p>
                <p className="font-semibold text-orange-500">{formatCurrency(gastosAPagar)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Total de Despesas</p>
                <p className="font-semibold text-red-600">{formatCurrency(totalGastosComprometidos)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Total Receitas</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalReceitas)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se obra única, mostrar detalhes completos
  if (!obra) return null;

  const gastosPagos = gastos
    .filter(g => g.status_pagamento === 'pago')
    .reduce((sum, g) => sum + (g.valor || 0), 0);

  const gastosAPagar = gastos
    .filter(g => ['programado', 'atrasado', 'pendente'].includes(g.status_pagamento))
    .reduce((sum, g) => sum + (g.valor || 0), 0);
  
  const totalGastosComprometidos = gastosPagos + gastosAPagar;
  const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
  
  const orcamentoInicial = obra.orcamento_inicial || 0;
  const valorVendaProjetado = obra.valor_venda_projetado || 0;
  
  const lucroProjetado = valorVendaProjetado - orcamentoInicial;
  const restanteOrcamento = orcamentoInicial - totalGastosComprometidos;
  const lucroEstimadoAtual = valorVendaProjetado - totalGastosComprometidos;

  const getStatusColor = (status) => {
    const colors = {
      planejamento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
      finalizada: 'bg-green-100 text-green-800 border-green-200',
      vendida: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      planejamento: 'Planejamento',
      em_andamento: 'Em Andamento',
      finalizada: 'Finalizada',
      vendida: 'Vendida'
    };
    return labels[status] || status;
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Relatório da Obra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="print-header">
          <div className="print-logo-section flex items-center gap-4">
            {workspaceInfo?.logoUrl && (
              <img src={workspaceInfo.logoUrl} alt="Logo" className="print-logo h-16 w-auto" />
            )}
            <div className="print-company-info">
              <h1 className="text-2xl font-bold text-slate-900">{workspaceInfo?.name}</h1>
              {workspaceInfo?.cnpj && (
                <p className="text-sm text-slate-600">CNPJ: {workspaceInfo.cnpj}</p>
              )}
              <p className="text-sm text-slate-600">Gestão e Controle de Obras</p>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">{obra.nome}</h3>
            <Badge className={`${getStatusColor(obra.status)} border`}>
              {getStatusLabel(obra.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            {obra.endereco}
          </div>

          {obra.data_inicio && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              Início: {format(new Date(obra.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Resumo Financeiro Atual</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
            <div>
              <p className="text-slate-500">Gastos Pagos</p>
              <p className="font-semibold text-red-600">{formatCurrency(gastosPagos)}</p>
            </div>
            <div>
              <p className="text-slate-500">Gastos a Pagar</p>
              <p className="font-semibold text-orange-500">{formatCurrency(gastosAPagar)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Total de Despesas</p>
              <p className="font-semibold text-red-600">{formatCurrency(totalGastosComprometidos)}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Receita</p>
              <p className="font-semibold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
            <div>
              <p className="text-slate-500">Disponível no Orçamento</p>
              <p className={`font-semibold ${restanteOrcamento >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(restanteOrcamento)}
              </p>
            </div>
             <div className="col-span-2 border-t pt-4">
                <p className="text-slate-500">Lucro Estimado (Venda Projetada - Despesas Totais)</p>
                <p className={`font-bold text-lg ${lucroEstimadoAtual >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(lucroEstimadoAtual)}
                </p>
            </div>
          </div>
        </div>

        {/* Projeções Iniciais */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">Projeções Iniciais</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {obra.orcamento_inicial && (
              <div>
                <p className="text-slate-500">Orçamento Inicial</p>
                <p className="font-semibold">{formatCurrency(orcamentoInicial)}</p>
              </div>
            )}
            {obra.valor_venda_projetado && (
              <div>
                <p className="text-slate-500">Venda Projetada</p>
                <p className="font-semibold">{formatCurrency(valorVendaProjetado)}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-slate-500">Lucro Projetado (Inicial)</p>
              <p className={`font-semibold ${lucroProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(lucroProjetado)}
              </p>
            </div>
            {obra.valor_venda_real && (
              <div>
                <p className="text-slate-500">Venda Real</p>
                <p className="font-semibold">{formatCurrency(obra.valor_venda_real)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Áreas */}
        {(obra.area_construida || obra.area_terreno) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Áreas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {obra.area_construida && (
                <div>
                  <p className="text-slate-500">Área Construída</p>
                  <p className="font-semibold">{obra.area_construida}m²</p>
                </div>
              )}
              {obra.area_terreno && (
                <div>
                  <p className="text-slate-500">Área do Terreno</p>
                  <p className="font-semibold">{obra.area_terreno}m²</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contratos */}
        {contratos && contratos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Contratos da Obra</h4>
            <div className="grid grid-cols-1 gap-4 text-sm">
              {contratos.map((contrato) => (
                <div key={contrato.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                  <p className="font-semibold text-slate-700">{contrato.nome}</p>
                  {contrato.tipo_contrato && <p className="text-slate-600">Tipo: {contrato.tipo_contrato}</p>}
                  <p className="text-slate-600">Valor: {formatCurrency(contrato.valor || 0)}</p>
                  {contrato.data_assinatura && (
                    <p className="text-slate-600">Assinado em: {format(new Date(contrato.data_assinatura), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  )}
                  {contrato.status && (
                    <Badge className="mt-2 bg-gray-100 text-gray-800 border border-gray-200">
                        {contrato.status.charAt(0).toUpperCase() + contrato.status.slice(1).replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {obra.observacoes && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Observações</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              {obra.observacoes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
