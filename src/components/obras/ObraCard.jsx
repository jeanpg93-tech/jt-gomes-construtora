import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, DollarSign, TrendingUp, Edit, Eye, Calculator, Power } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

export default function ObraCard({ obra, onEdit, getStatusColor, getStatusLabel, isSelectMode, isSelected, onSelectToggle }) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Cálculos automáticos
  const calcularValorTotalMaoObra = () => {
    if (!obra.area_construida || !obra.valor_mao_obra_m2) return 0;
    return obra.area_construida * obra.valor_mao_obra_m2;
  };

  const calcularValorTotalGastosProjetado = () => {
    const terreno = obra.valor_terreno || 0;
    const materiais = obra.previsao_gastos_materiais || 0;
    const maoObra = calcularValorTotalMaoObra();
    return terreno + materiais + maoObra;
  };

  const calcularValorVendaReal = () => {
    // Se foi informado valor_venda_real manualmente, usar ele
    if (obra.valor_venda_real && obra.valor_venda_real > 0) return obra.valor_venda_real;

    // Senão, calcular a partir do valor projetado
    if (!obra.valor_venda_projetado) return 0;
    const vendaBruto = obra.valor_venda_projetado;
    const imposto = obra.imposto_percentual || 0;
    const comissao = obra.comissao_percentual || 0;

    const descontoImposto = vendaBruto * (imposto / 100);
    const descontoComissao = vendaBruto * (comissao / 100);

    return vendaBruto - descontoImposto - descontoComissao;
  };

  const calcularLucroProjetado = () => {
    const valorVenda = calcularValorVendaReal();
    const gastosProjetados = calcularValorTotalGastosProjetado();
    return valorVenda - gastosProjetados;
  };

  const calcularMargemLucro = () => {
    const valorVenda = calcularValorVendaReal();
    const lucro = calcularLucroProjetado();
    if (valorVenda === 0) return 0;
    return (lucro / valorVenda) * 100;
  };

  // Calcular gastos realizados (apenas os gastos registrados, que já incluem terreno e materiais)
  const calcularGastosRealizados = () => {
    return obra.gastos_totais || 0;
  };

  // Calcular quanto falta gastar
  const calcularAGastar = () => {
    const gastosProjetados = calcularValorTotalGastosProjetado();
    const gastosRealizados = calcularGastosRealizados();
    return gastosProjetados - gastosRealizados;
  };

  const valorTotalMaoObra = calcularValorTotalMaoObra();
  const valorTotalGastosProjetado = calcularValorTotalGastosProjetado();
  const valorVendaReal = calcularValorVendaReal();
  const lucroProjetado = calcularLucroProjetado();
  const margemLucro = calcularMargemLucro();
  const gastosRealizados = calcularGastosRealizados();
  const aGastar = calcularAGastar();

  const percentUsed = valorTotalGastosProjetado > 0
    ? (gastosRealizados / valorTotalGastosProjetado) * 100
    : 0;

  const isAtiva = obra.ativa !== false; // Default to true if not set

  return (
    <Card
      className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md h-full relative ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''} ${!isAtiva ? 'opacity-60' : ''}`}
      onClick={isSelectMode ? onSelectToggle : undefined}
    >
      {isSelectMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectToggle}
          className="absolute top-4 right-4 z-10 bg-white h-5 w-5"
          aria-label="Selecionar obra"
        />
      )}

      {/* Indicador de Ativa/Inativa */}
      {!isAtiva && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
            <Power className="w-3 h-3" />
            Inativa
          </Badge>
        </div>
      )}

      {/* Foto da Obra */}
      {obra.foto_url && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={obra.foto_url} 
            alt={obra.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <Badge className={`${getStatusColor(obra.status)} border absolute top-3 right-3`}>
            {getStatusLabel(obra.status)}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {obra.nome}
              </h3>
              {!obra.foto_url && (
                <Badge className={`${getStatusColor(obra.status)} border`}>
                  {getStatusLabel(obra.status)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              {obra.endereco}
            </div>
          </div>
          {!isSelectMode && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(obra); }}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {obra.area_construida && (
            <div>
              <p className="text-slate-500">Área Construída</p>
              <p className="font-semibold">{obra.area_construida}m²</p>
            </div>
          )}
          {obra.area_terreno && (
            <div>
              <p className="text-slate-500">Área Terreno</p>
              <p className="font-semibold">{obra.area_terreno}m²</p>
            </div>
          )}
        </div>

        {/* Datas */}
        {(obra.data_inicio || obra.data_previsao_entrega) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {obra.data_inicio && (
              <div>
                <p className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Início
                </p>
                <p className="font-semibold">
                  {format(new Date(obra.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            {obra.data_previsao_entrega && (
              <div>
                <p className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Entrega
                </p>
                <p className="font-semibold">
                  {format(new Date(obra.data_previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Composição de Custos Detalhados */}
        {(obra.valor_terreno || obra.previsao_gastos_materiais || valorTotalMaoObra > 0) && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-slate-700">Composição de Custos</span>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 space-y-2 text-sm">
              {obra.valor_terreno > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Terreno:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(obra.valor_terreno)}</span>
                </div>
              )}
              {obra.previsao_gastos_materiais > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Materiais:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(obra.previsao_gastos_materiais)}</span>
                </div>
              )}
              {valorTotalMaoObra > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Mão de Obra:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(valorTotalMaoObra)}</span>
                </div>
              )}
              {valorTotalGastosProjetado > 0 && (
                <div className="flex justify-between pt-2 border-t border-amber-200">
                  <span className="text-slate-700 font-semibold">Total Projetado:</span>
                  <span className="font-bold text-amber-900">{formatCurrency(valorTotalGastosProjetado)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acompanhamento de Gastos */}
        {valorTotalGastosProjetado > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Gastos Realizados</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(gastosRealizados)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Inclui terreno e materiais já lançados</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">A Gastar</span>
              <span className={`font-bold ${aGastar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(aGastar)}
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-1">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentUsed < 70 ? 'bg-green-500' :
                    percentUsed < 90 ? 'bg-yellow-500' :
                    percentUsed < 100 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${
                  percentUsed < 70 ? 'text-green-600' :
                  percentUsed < 90 ? 'text-yellow-600' :
                  percentUsed < 100 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {percentUsed.toFixed(1)}% utilizado
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Valores de Venda */}
        {valorVendaReal > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-green-700">Valor Venda Bruto</p>
                  <p className="text-sm font-semibold text-green-800">
                    {formatCurrency(obra.valor_venda_projetado)}
                  </p>
                </div>
                {(obra.imposto_percentual || obra.comissao_percentual) && (
                  <div className="text-right">
                    <p className="text-xs text-slate-600">
                      Descontos: {((obra.imposto_percentual || 0) + (obra.comissao_percentual || 0)).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-green-700 font-medium">Valor Venda Real</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(valorVendaReal)}
                </p>
              </div>
            </div>

            {/* Lucro projetado */}
            {valorTotalGastosProjetado > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Lucro Projetado</p>
                    <p className={`text-lg font-bold ${lucroProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lucroProjetado)}
                    </p>
                  </div>
                  {margemLucro !== 0 && (
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Margem</p>
                      <p className={`text-lg font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margemLucro.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}