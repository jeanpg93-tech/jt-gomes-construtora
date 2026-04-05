import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Orcamento() {
  const [obras, setObras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedObraIds, setSelectedObraIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [obrasData, gastosData, categoriasData] = await Promise.all([
        base44.entities.Obra.list('-created_date'),
        base44.entities.Gasto.list(),
        base44.entities.CategoriaGasto.list()
      ]);
      
      setObras(obrasData);
      setGastos(gastosData);
      setCategorias(categoriasData);
      
      // Não pré-selecionar nenhuma obra — o usuário escolhe
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleObraSelection = (obraId) => {
    setSelectedObraIds(prev => {
      if (prev.includes(obraId)) {
        return prev.filter(id => id !== obraId);
      } else {
        return [...prev, obraId];
      }
    });
  };

  const selectAllObras = () => {
    setSelectedObraIds(obras.filter(o => o.ativa !== false).map(o => o.id));
  };

  const clearSelection = () => {
    setSelectedObraIds([]);
  };

  const obrasSelecionadas = obras.filter(o => selectedObraIds.includes(o.id));
  const gastosObras = gastos.filter(g => selectedObraIds.includes(g.obra_id));
  
  const totalGastos = gastosObras.reduce((sum, g) => sum + (g.valor || 0), 0);
  
  // Calcular orçamento projetado total (soma dos componentes)
  const orcamentoPrevisto = obrasSelecionadas.reduce((sum, o) => {
    const terreno = o.valor_terreno || 0;
    const materiais = o.previsao_gastos_materiais || 0;
    const maoObra = (o.area_construida && o.valor_mao_obra_m2) ? (o.area_construida * o.valor_mao_obra_m2) : 0;
    return sum + terreno + materiais + maoObra;
  }, 0);
  
  // Gastos realizados são apenas os gastos lançados
  const gastosRealizados = totalGastos;
  
  const aGastar = orcamentoPrevisto - gastosRealizados;
  const percentualUsado = orcamentoPrevisto > 0 ? (gastosRealizados / orcamentoPrevisto) * 100 : 0;
  
  const gastosPorCategoria = categorias.map(cat => {
    const gastosCategoria = gastosObras.filter(g => g.categoria_id === cat.id);
    const total = gastosCategoria.reduce((sum, g) => sum + (g.valor || 0), 0);
    const percentual = orcamentoPrevisto > 0 ? (total / orcamentoPrevisto) * 100 : 0;
    
    return {
      categoria: cat.nome,
      total,
      percentual,
      quantidade: gastosCategoria.length
    };
  }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total);

  // Calcular valores de venda
  const valorVendaProjetado = obrasSelecionadas.reduce((sum, o) => sum + (o.valor_venda_projetado || 0), 0);
  
  const valorVendaReal = obrasSelecionadas.reduce((sum, o) => {
    // Se tem valor_venda_real manual, usar ele
    if (o.valor_venda_real) return sum + o.valor_venda_real;
    
    // Senão calcular a partir do projetado
    if (!o.valor_venda_projetado) return sum;
    const vendaBruto = o.valor_venda_projetado;
    const imposto = o.imposto_percentual || 0;
    const comissao = o.comissao_percentual || 0;
    const descontos = vendaBruto * ((imposto + comissao) / 100);
    return sum + (vendaBruto - descontos);
  }, 0);
  
  const lucroProjetadoInicial = valorVendaReal - orcamentoPrevisto;
  const lucroAtualizado = valorVendaReal - gastosRealizados;
  const margemLucro = valorVendaReal > 0 ? (lucroAtualizado / valorVendaReal) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">
          Nenhuma obra cadastrada
        </h3>
        <p className="text-slate-500">
          Cadastre uma obra para começar o acompanhamento de orçamento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Acompanhamento de Orçamento
          </h1>
          <p className="text-slate-600">
            Monitore os gastos e compare com o orçamento previsto
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllObras}>
            Todas
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Limpar
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Selecione as Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {obras.filter(o => o.ativa !== false).map(obra => (
              <div
                key={obra.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  selectedObraIds.includes(obra.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => toggleObraSelection(obra.id)}
              >
                <Checkbox
                  checked={selectedObraIds.includes(obra.id)}
                  onCheckedChange={() => toggleObraSelection(obra.id)}
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{obra.nome}</p>
                  <p className="text-xs text-slate-500">{obra.endereco}</p>
                </div>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedObraIds.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Selecione uma ou mais obras
            </h3>
            <p className="text-slate-500">
              Escolha as obras acima para visualizar o acompanhamento de orçamento
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    {selectedObraIds.length === 1 
                      ? obrasSelecionadas[0].nome 
                      : `${selectedObraIds.length} obras selecionadas`}
                  </CardTitle>
                  {selectedObraIds.length === 1 && obrasSelecionadas[0].endereco && (
                    <p className="text-sm text-slate-600 mt-1">{obrasSelecionadas[0].endereco}</p>
                  )}
                </div>
                <Badge className={
                  percentualUsado > 100 ? 'bg-red-100 text-red-800' :
                  percentualUsado > 80 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }>
                  {percentualUsado.toFixed(1)}% utilizado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium">Orçamento Projetado</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(orcamentoPrevisto)}</p>
                  <p className="text-xs text-slate-600 mt-1">Terreno + Materiais + Mão de Obra</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-medium">Gastos Realizados</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(gastosRealizados)}</p>
                  <p className="text-xs text-slate-600 mt-1">Gastos já lançados (terreno + materiais)</p>
                </div>
                <div className={`bg-gradient-to-br p-4 rounded-lg ${
                  aGastar >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'
                }`}>
                  <div className={`flex items-center gap-2 mb-2 ${
                    aGastar >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">A Gastar</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    aGastar >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>{formatCurrency(aGastar)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Progresso do Orçamento</span>
                  <span className="text-sm font-bold text-slate-900">{percentualUsado.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(percentualUsado, 100)} 
                  className={`h-3 ${
                    percentualUsado > 100 ? '[&>div]:bg-red-600' :
                    percentualUsado > 80 ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-green-600'
                  }`}
                />
                {percentualUsado > 90 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Atenção: O orçamento está próximo do limite!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {valorVendaReal > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Projeção de Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Venda Projetado (Bruto)</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(valorVendaProjetado)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Venda Real (Líquido)</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(valorVendaReal)}</p>
                    <p className="text-xs text-slate-600 mt-1">Após impostos e comissões</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-700 mb-2">
                      <Target className="w-5 h-5" />
                      <span className="text-sm font-medium">Lucro Projetado (Inicial)</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">{formatCurrency(lucroProjetadoInicial)}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    lucroAtualizado >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className={`flex items-center gap-2 mb-2 ${
                      lucroAtualizado >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">Lucro Atualizado</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      lucroAtualizado >= 0 ? 'text-green-900' : 'text-red-900'
                    }`}>{formatCurrency(lucroAtualizado)}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Margem: {margemLucro.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {gastosPorCategoria.length > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gastosPorCategoria.map((cat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{cat.categoria}</span>
                          <Badge variant="outline" className="text-xs">
                            {cat.quantidade} {cat.quantidade === 1 ? 'gasto' : 'gastos'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(cat.total)}</p>
                          <p className="text-xs text-slate-500">{cat.percentual.toFixed(1)}% do total</p>
                        </div>
                      </div>
                      <Progress value={cat.percentual} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}