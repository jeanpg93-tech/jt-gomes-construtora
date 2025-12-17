import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Download, PieChart, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

import RelatorioObra from "../components/relatorios/RelatorioObra";
import DetalheGastosCategoria from "../components/relatorios/DetalheGastosCategoria";
import MediaGastosCategoria from "../components/relatorios/MediaGastosCategoria";
import GraficoGastosPizza from "../components/relatorios/GraficoGastosPizza";

export default function Relatorios() {
  const [obras, setObras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [gastosAdmin, setGastosAdmin] = useState([]);
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [subcategoriasGasto, setSubcategoriasGasto] = useState([]);
  const [subcategoriasGasto2, setSubcategoriasGasto2] = useState([]);
  const [categoriasReceita, setCategoriasReceita] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [etapasObra, setEtapasObra] = useState([]);
  const [workspaceInfo, setWorkspaceInfo] = useState({ name: 'ConstrutoraPro', logoUrl: null, cnpj: null });
  
  const [selectedObraIds, setSelectedObraIds] = useState([]);
  const [selectedCategoriaIds, setSelectedCategoriaIds] = useState([]);
  const [selectedSubcategoriaIds, setSelectedSubcategoriaIds] = useState([]);
  const [selectedSubcategoria2Ids, setSelectedSubcategoria2Ids] = useState([]);
  const [selectedEtapaIds, setSelectedEtapaIds] = useState([]);
  const [selectedStatusPagamento, setSelectedStatusPagamento] = useState("all");
  const [incluirGastosAdmin, setIncluirGastosAdmin] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    loadData();
    loadWorkspaceInfo();
    loadURLParams();
  }, []);

  const loadURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const obraIdsParam = urlParams.get('selectedObraIds');
    if (obraIdsParam) {
      try {
        const ids = JSON.parse(obraIdsParam);
        if (Array.isArray(ids)) {
          setSelectedObraIds(ids);
        } else {
          setSelectedObraIds([ids]);
        }
      } catch (e) {
        setSelectedObraIds([obraIdsParam]);
      }
    }
    
    const dataInicioParam = urlParams.get('dataInicio');
    if (dataInicioParam) {
      setDataInicio(dataInicioParam);
    }
    
    const dataFimParam = urlParams.get('dataFim');
    if (dataFimParam) {
      setDataFim(dataFimParam);
    }
  };

  const loadWorkspaceInfo = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        setWorkspaceInfo({
          name: user.workspace_name || 'ConstrutoraPro',
          logoUrl: user.workspace_logo || null,
          cnpj: user.construtora_cnpj || null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações do workspace:', error);
    }
  };

  const loadData = async () => {
    try {
      const [obraData, gastoData, receitaData, gastosAdminData, catGastoData, subcatGastoData, subcatGasto2Data, catReceitaData, fornecedorData, etapaData] = await Promise.all([
        base44.entities.Obra.list('-created_date'),
        base44.entities.Gasto.list(),
        base44.entities.Receita.list(),
        base44.entities.GastoAdministrativo.list(),
        base44.entities.CategoriaGasto.list(),
        base44.entities.SubcategoriaGasto.list(),
        base44.entities.SubcategoriaGasto2.list(),
        base44.entities.CategoriaReceita.list(),
        base44.entities.Fornecedor.list(),
        base44.entities.EtapaObra.list()
      ]);
      setObras(obraData);
      setGastos(gastoData);
      setReceitas(receitaData);
      setGastosAdmin(gastosAdminData);
      setCategoriasGasto(catGastoData);
      setSubcategoriasGasto(subcatGastoData);
      setSubcategoriasGasto2(subcatGasto2Data);
      setCategoriasReceita(catReceitaData);
      setFornecedores(fornecedorData);
      setEtapasObra(etapaData.sort((a, b) => (a.ordem || 999) - (b.ordem || 999)));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarGastosPorData = (gastos, dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return gastos;
    
    const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);
    
    const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio);
    dataInicioObj.setDate(dataInicioObj.getDate() + 1);
    
    const dataFimObj = new Date(anoFim, mesFim - 1, diaFim);
    dataFimObj.setDate(dataFimObj.getDate() + 1);
    
    const inicio = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth(), dataInicioObj.getDate(), 0, 0, 0);
    const fim = new Date(dataFimObj.getFullYear(), dataFimObj.getMonth(), dataFimObj.getDate(), 23, 59, 59);
    
    return gastos.filter(gasto => {
      const dataStr = gasto.data_pagamento || gasto.data;
      if (!dataStr) return false;
      
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      const dataGasto = new Date(ano, mes - 1, dia, 12, 0, 0);
      
      return dataGasto >= inicio && dataGasto <= fim;
    });
  };

  const filtrarReceitasPorData = (receitas, dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return receitas;

    const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);
    
    const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio);
    dataInicioObj.setDate(dataInicioObj.getDate() + 1);
    
    const dataFimObj = new Date(anoFim, mesFim - 1, diaFim);
    dataFimObj.setDate(dataFimObj.getDate() + 1);
    
    const inicio = new Date(dataInicioObj.getFullYear(), dataInicioObj.getMonth(), dataInicioObj.getDate(), 0, 0, 0);
    const fim = new Date(dataFimObj.getFullYear(), dataFimObj.getMonth(), dataFimObj.getDate(), 23, 59, 59);

    return receitas.filter(receita => {
      const dataStr = receita.data;
      if (!dataStr) return false;
      
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      const dataReceita = new Date(ano, mes - 1, dia, 12, 0, 0);
      
      return dataReceita >= inicio && dataReceita <= fim;
    });
  };

  const applyGeneralFilters = (items, selectedObraIds, selectedCategoriaIds, selectedSubcategoriaIds, selectedSubcategoria2Ids, selectedStatusPagamento, selectedEtapaIds) => {
    let filtered = items;

    if (selectedStatusPagamento !== "all" && items.length > 0 && 'status_pagamento' in items[0]) {
      if (selectedStatusPagamento === "pagos") {
        filtered = filtered.filter(g => g.status_pagamento === 'pago');
      } else if (selectedStatusPagamento === "nao_pagos") {
        filtered = filtered.filter(g => ['pendente', 'programado', 'atrasado'].includes(g.status_pagamento));
      }
    }

    if (selectedObraIds.length > 0) {
        filtered = filtered.filter(item => selectedObraIds.includes(item.obra_id));
    }

    if (items.length > 0 && 'categoria_id' in items[0]) {
        if (selectedCategoriaIds.length > 0) {
            filtered = filtered.filter(g => selectedCategoriaIds.includes(g.categoria_id));
        }
        if (selectedSubcategoriaIds.length > 0) {
            filtered = filtered.filter(g => selectedSubcategoriaIds.includes(g.subcategoria_id));
        }
        if (selectedSubcategoria2Ids.length > 0) {
            filtered = filtered.filter(g => selectedSubcategoria2Ids.includes(g.subcategoria_2_id));
        }
        if (selectedEtapaIds.length > 0) {
            filtered = filtered.filter(g => {
                const etapasDoGasto = g.etapa_obra_ids || [];
                return selectedEtapaIds.some(etapaId => etapasDoGasto.includes(etapaId));
            });
        }
    }
    
    return filtered;
  };

  const gastosComDataFiltrada = filtrarGastosPorData(gastos, dataInicio, dataFim);
  const gastosFiltrados = applyGeneralFilters(
    gastosComDataFiltrada,
    selectedObraIds,
    selectedCategoriaIds,
    selectedSubcategoriaIds,
    selectedSubcategoria2Ids,
    selectedStatusPagamento,
    selectedEtapaIds
  );

  const gastosAdminComDataFiltrada = filtrarGastosPorData(gastosAdmin, dataInicio, dataFim);
  const gastosAdminFiltrados = gastosAdminComDataFiltrada;

  const receitasComDataFiltrada = filtrarReceitasPorData(receitas, dataInicio, dataFim);
  const receitasFiltradas = applyGeneralFilters(
    receitasComDataFiltrada,
    selectedObraIds,
    [],
    [],
    [],
    "all",
    []
  );

  const subcategoriasDisponiveis = selectedCategoriaIds.length === 0
    ? []
    : subcategoriasGasto.filter(sub => selectedCategoriaIds.includes(sub.categoria_id));

  const subcategorias2Disponiveis = selectedSubcategoriaIds.length === 0
    ? []
    : subcategoriasGasto2.filter(sub2 => selectedSubcategoriaIds.includes(sub2.subcategoria_id));

  const handleObraToggle = (obraId) => {
    setSelectedObraIds(prev =>
      prev.includes(obraId) ? prev.filter(id => id !== obraId) : [...prev, obraId]
    );
  };

  const handleSelectAllObras = () => {
    setSelectedObraIds(obras.filter(o => o.ativa !== false).map(o => o.id));
  };

  const handleClearObras = () => {
    setSelectedObraIds([]);
  };

  const handleCategoriaToggle = (catId) => {
    setSelectedCategoriaIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCategorias = () => {
    setSelectedCategoriaIds(categoriasGasto.map(c => c.id));
  };

  const handleClearCategorias = () => {
    setSelectedCategoriaIds([]);
  };

  const handleSubcategoriaToggle = (subId) => {
    setSelectedSubcategoriaIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAllSubcategorias = () => {
    setSelectedSubcategoriaIds(subcategoriasDisponiveis.map(s => s.id));
  };

  const handleClearSubcategorias = () => {
    setSelectedSubcategoriaIds([]);
  };

  const handleSubcategoria2Toggle = (sub2Id) => {
    setSelectedSubcategoria2Ids(prev =>
      prev.includes(sub2Id) ? prev.filter(id => id !== sub2Id) : [...prev, sub2Id]
    );
  };

  const handleSelectAllSubcategorias2 = () => {
    setSelectedSubcategoria2Ids(subcategorias2Disponiveis.map(s => s.id));
  };

  const handleClearSubcategorias2 = () => {
    setSelectedSubcategoria2Ids([]);
  };

  const handleEtapaToggle = (etapaId) => {
    setSelectedEtapaIds(prev =>
      prev.includes(etapaId) ? prev.filter(id => id !== etapaId) : [...prev, etapaId]
    );
  };

  const handleSelectAllEtapas = () => {
    setSelectedEtapaIds(etapasObra.map(e => e.id));
  };

  const handleClearEtapas = () => {
    setSelectedEtapaIds([]);
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const dadosParaPDF = () => {
    if (selectedObraIds.length === 0) return null;

    const gastosPagos = gastosFiltrados.filter(g => g.status_pagamento === 'pago').reduce((sum, g) => sum + g.valor, 0);
    const gastosAPagar = gastosFiltrados.filter(g => ['programado', 'atrasado', 'pendente'].includes(g.status_pagamento)).reduce((sum, g) => sum + g.valor, 0);
    const totalGastosObras = gastosPagos + gastosAPagar;
    
    const totalGastosAdmin = incluirGastosAdmin ? gastosAdminFiltrados.reduce((sum, g) => sum + g.valor, 0) : 0;
    const totalGeralGastos = totalGastosObras + totalGastosAdmin;
    
    const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + r.valor, 0);
    
    const selectedObra = obras.find(o => selectedObraIds.includes(o.id));
    const lucroEstimado = selectedObra && selectedObraIds.length === 1 ? ((selectedObra.valor_venda_projetado || 0) - totalGeralGastos) : 0;

    const gastosPorCategoria = categoriasGasto
      .map(cat => {
        const gastosCategoria = gastosFiltrados.filter(g => g.categoria_id === cat.id);
        const total = gastosCategoria.reduce((sum, g) => sum + g.valor, 0);
        return {
          categoria: cat.nome,
          total: total,
          transacoes: gastosCategoria.length,
          media: gastosCategoria.length > 0 ? total / gastosCategoria.length : 0,
          gastos: gastosCategoria
        };
      })
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total);

    let periodoExibicao = 'Período completo';
    if (dataInicio && dataFim) {
      const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number);
      const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);
      
      const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio);
      const dataFimObj = new Date(anoFim, mesFim - 1, diaFim);
      
      periodoExibicao = `${format(dataInicioObj, 'dd/MM/yyyy')} a ${format(dataFimObj, 'dd/MM/yyyy')}`;
    }

    const gastosOrganizadosPorObra = selectedObraIds.map(obraId => {
      const obra = obras.find(o => o.id === obraId);
      const gastosObra = gastosFiltrados
        .filter(g => g.obra_id === obraId)
        .sort((a, b) => {
          const dateA = new Date(a.data_pagamento || a.data);
          const dateB = new Date(b.data_pagamento || b.data);
          return dateA.getTime() - dateB.getTime();
        });
      
      return {
        obra,
        gastos: gastosObra,
        total: gastosObra.reduce((sum, g) => sum + g.valor, 0)
      };
    }).filter(item => item.gastos.length > 0);

    return {
      obra: selectedObra,
      obras: obras.filter(o => selectedObraIds.includes(o.id)),
      multiplaObras: selectedObraIds.length > 1,
      periodo: periodoExibicao,
      resumoFinanceiro: {
        gastosPagos,
        gastosAPagar,
        totalGastosObras,
        totalGastosAdmin,
        totalGeralGastos,
        totalReceitas,
        lucroEstimado
      },
      gastosPorCategoria,
      gastosDetalhados: gastosFiltrados.sort((a, b) => {
        const dateA = new Date(a.data_pagamento || a.data);
        const dateB = new Date(b.data_pagamento || b.data);
        return dateA.getTime() - dateB.getTime();
      }),
      gastosOrganizadosPorObra,
      gastosAdministrativos: incluirGastosAdmin ? gastosAdminFiltrados.sort((a, b) => {
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateA.getTime() - dateB.getTime();
      }) : [],
      incluirGastosAdmin
    };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedObra = obras.find(o => selectedObraIds.includes(o.id));
  const dadosPDF = dadosParaPDF();

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #000;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .print-show {
            display: block !important;
          }
          
          .print-page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 12px;
            margin-bottom: 15px;
            border-bottom: 2px solid #1e40af;
          }
          
          .print-logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .print-logo {
            width: 40px;
            height: 40px;
            border-radius: 6px;
          }
          
          .print-company-info h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 3px 0;
            color: #000;
          }
          
          .print-company-info p {
            font-size: 10px;
            color: #666;
            margin: 0;
          }
          
          .print-report-info {
            text-align: right;
          }
          
          .print-report-info h2 {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin: 0 0 6px 0;
          }
          
          .print-report-info p {
            font-size: 9px;
            color: #333;
            margin: 1px 0;
            line-height: 1.2;
          }
          
          .print-summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin: 12px 0;
          }
          
          .print-summary-card {
            border: 2px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            background: #f8fafc;
            text-align: center;
          }
          
          .print-summary-card h3 {
            font-size: 8px;
            color: #475569;
            text-transform: uppercase;
            margin: 0 0 6px 0;
            font-weight: 600;
            letter-spacing: 0.3px;
          }
          
          .print-summary-card p {
            font-size: 14px;
            font-weight: bold;
            margin: 0;
            color: #1e293b;
          }
          
          .print-summary-card.positive {
            border-color: #10b981;
            background: #ecfdf5;
          }
          
          .print-summary-card.positive p {
            color: #059669;
          }
          
          .print-summary-card.negative {
            border-color: #ef4444;
            background: #fef2f2;
          }
          
          .print-summary-card.negative p {
            color: #dc2626;
          }
          
          .print-summary-card.neutral {
            border-color: #3b82f6;
            background: #eff6ff;
          }
          
          .print-summary-card.neutral p {
            color: #2563eb;
          }
          
          .print-summary-card.admin {
            border-color: #8b5cf6;
            background: #f5f3ff;
          }
          
          .print-summary-card.admin p {
            color: #7c3aed;
          }
          
          .print-section {
            margin: 18px 0;
            page-break-inside: avoid;
          }
          
          .print-section h2 {
            font-size: 12px;
            font-weight: bold;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #1e40af;
            color: #1e293b;
          }
          
          .print-section h3 {
            font-size: 11px;
            font-weight: bold;
            margin: 15px 0 8px 0;
            padding-bottom: 3px;
            border-bottom: 1px solid #cbd5e1;
            color: #475569;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 8px;
          }
          
          .print-table thead {
            background: #1e40af;
          }
          
          .print-table thead th {
            color: #ffffff !important;
            background: #1e40af !important;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1e40af;
          }
          
          .print-table tbody td {
            padding: 5px 4px;
            border: 1px solid #cbd5e1;
            color: #1e293b;
          }
          
          .print-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .print-table .text-right {
            text-align: right;
          }
          
          .print-table .text-center {
            text-align: center;
          }
          
          .print-table .total-row {
            background: #e2e8f0 !important;
            font-weight: bold;
            border: 2px solid #000000 !important;
          }

          .print-table .total-row td {
            color: #000000 !important;
            border-color: #000000 !important;
            padding: 7px 4px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: bold !important;
          }
          
          .print-table .subtotal-row {
            background: #e0e7ff !important;
            font-weight: 600;
          }
          
          .print-table .subtotal-row td {
            color: #1e293b !important;
            border-color: #c7d2fe !important;
          }
          
          .print-table .admin-row {
            background: #f5f3ff !important;
          }
          
          .print-table .admin-row td {
            color: #5b21b6 !important;
          }
          
          .print-obra-header {
            background: #f1f5f9;
            padding: 8px 10px;
            margin: 12px 0 8px 0;
            border-left: 3px solid #1e40af;
            border-radius: 3px;
          }
          
          .print-obra-header h3 {
            margin: 0;
            font-size: 11px;
            font-weight: bold;
            color: #1e293b;
          }
          
          .print-obra-header p {
            margin: 3px 0 0 0;
            font-size: 9px;
            color: #64748b;
          }
          
          .print-chart {
            width: 100%;
            height: 200px;
            margin: 12px 0;
            page-break-inside: avoid;
          }
          
          .print-footer {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            text-align: center;
          }
          
          .print-footer p {
            font-size: 7px;
            color: #64748b;
            margin: 2px 0;
          }
          
          .print-admin-section {
            background: #f5f3ff;
            padding: 10px;
            margin: 15px 0;
            border-left: 3px solid #8b5cf6;
            border-radius: 3px;
          }
        }
      `}</style>

      {/* Screen Version */}
      <div className="print-hide">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatórios</h1>
            <p className="text-slate-600">Analise o desempenho de suas obras.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div>
                <Label htmlFor="dataInicio" className="text-xs">De</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-xs">Até</Label>
                <Input id="dataFim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Selecionar Obras:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAllObras} className="text-xs">
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearObras} className="text-xs">
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {obras.filter(o => o.ativa !== false).map(obra => (
                    <Button
                      key={obra.id}
                      variant={selectedObraIds.includes(obra.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleObraToggle(obra.id)}
                    >
                      {obra.nome}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opção para incluir gastos administrativos */}
            <Card className="shadow-sm bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluir-gastos-admin" 
                    checked={incluirGastosAdmin}
                    onCheckedChange={setIncluirGastosAdmin}
                  />
                  <label
                    htmlFor="incluir-gastos-admin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Incluir Gastos Administrativos no Relatório
                  </label>
                </div>
                {incluirGastosAdmin && (
                  <p className="text-xs text-purple-700 mt-2 ml-6">
                    Os gastos administrativos serão exibidos separadamente dos gastos das obras no relatório final.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <Select value={selectedStatusPagamento} onValueChange={setSelectedStatusPagamento}>
                    <SelectTrigger className="w-full sm:w-auto bg-white">
                        <SelectValue placeholder="Status de Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="pagos">Pagos</SelectItem>
                        <SelectItem value="nao_pagos">Não Pagos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Selecionar Categorias:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAllCategorias} className="text-xs">
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearCategorias} className="text-xs">
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriasGasto.map(cat => (
                    <Button
                      key={cat.id}
                      variant={selectedCategoriaIds.includes(cat.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoriaToggle(cat.id)}
                    >
                      {cat.nome}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedCategoriaIds.length > 0 && subcategoriasDisponiveis.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Selecionar Subcategorias 1:</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAllSubcategorias} className="text-xs">
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearSubcategorias} className="text-xs">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subcategoriasDisponiveis.map(sub => (
                      <Button
                        key={sub.id}
                        variant={selectedSubcategoriaIds.includes(sub.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSubcategoriaToggle(sub.id)}
                      >
                        {sub.nome}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSubcategoriaIds.length > 0 && subcategorias2Disponiveis.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Selecionar Subcategorias 2:</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAllSubcategorias2} className="text-xs">
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearSubcategorias2} className="text-xs">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subcategorias2Disponiveis.map(sub2 => (
                      <Button
                        key={sub2.id}
                        variant={selectedSubcategoria2Ids.includes(sub2.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSubcategoria2Toggle(sub2.id)}
                      >
                        {sub2.nome}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedObraIds.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Filtrar por Etapas da Obra:</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAllEtapas} className="text-xs">
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearEtapas} className="text-xs">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {etapasObra.map(etapa => (
                      <Button
                        key={etapa.id}
                        variant={selectedEtapaIds.includes(etapa.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleEtapaToggle(etapa.id)}
                      >
                        {etapa.nome}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
            </Button>
        </div>

        {obras.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Nenhuma obra encontrada</h3>
              <p className="text-slate-500">Cadastre uma obra para começar a ver os relatórios.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-1 space-y-6">
              {selectedObraIds.length > 0 ? (
                 <RelatorioObra 
                   obra={selectedObra} 
                   obras={selectedObraIds.length > 1 ? obras.filter(o => selectedObraIds.includes(o.id)) : null}
                   gastos={gastosFiltrados} 
                   receitas={receitasFiltradas} 
                 />
              ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm">Selecione uma ou mais obras para ver o resumo.</p>
                    </CardContent>
                </Card>
              )}
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-600" />
                        Distribuição de Gastos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <GraficoGastosPizza gastos={gastosFiltrados} categorias={categoriasGasto} />
                    </div>
                </CardContent>
              </Card>
              <DetalheGastosCategoria gastos={gastosFiltrados} categorias={categoriasGasto} />
              <MediaGastosCategoria gastos={gastosFiltrados} categorias={categoriasGasto} />
            </div>
          </div>
        )}
      </div>

      {/* Print Version */}
      <div className="print-show" style={{display: 'none'}}>
        {dadosPDF && (
          <div className="print-page">
            {/* HEADER */}
            <div className="print-header">
              <div className="print-logo-section">
                {workspaceInfo.logoUrl && (
                  <img src={workspaceInfo.logoUrl} alt="Logo" className="print-logo" />
                )}
                <div className="print-company-info">
                  <h1>{workspaceInfo.name}</h1>
                  {workspaceInfo.cnpj && (
                    <p style={{fontSize: '10px', marginTop: '2px'}}>CNPJ: {workspaceInfo.cnpj}</p>
                  )}
                  <p>Gestão e Controle de Obras</p>
                </div>
              </div>
              <div className="print-report-info">
                <h2>Relatório Financeiro</h2>
                {dadosPDF.multiplaObras ? (
                  <>
                    <p><strong>Obras:</strong> {dadosPDF.obras.map(o => o.nome).join(', ')}</p>
                  </>
                ) : (
                  <p><strong>Obra:</strong> {dadosPDF.obra?.nome}</p>
                )}
                <p><strong>Período:</strong> {dadosPDF.periodo}</p>
                <p><strong>Gerado:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="print-summary-cards">
              <div className="print-summary-card negative">
                <h3>Gastos das Obras</h3>
                <p>{formatCurrency(dadosPDF.resumoFinanceiro.totalGastosObras)}</p>
              </div>
              {dadosPDF.incluirGastosAdmin && (
                <div className="print-summary-card admin">
                  <h3>Gastos Administrativos</h3>
                  <p>{formatCurrency(dadosPDF.resumoFinanceiro.totalGastosAdmin)}</p>
                </div>
              )}
              <div className="print-summary-card positive">
                <h3>Total Receitas</h3>
                <p>{formatCurrency(dadosPDF.resumoFinanceiro.totalReceitas)}</p>
              </div>
              {!dadosPDF.multiplaObras && (
                <div className="print-summary-card neutral">
                  <h3>Lucro Estimado</h3>
                  <p>{formatCurrency(dadosPDF.resumoFinanceiro.lucroEstimado)}</p>
                </div>
              )}
            </div>

            {/* CHART SECTION */}
            <div className="print-section">
              <h2>Distribuição de Gastos por Categoria (Obras)</h2>
              <div className="print-chart">
                <GraficoGastosPizza gastos={gastosFiltrados} categorias={categoriasGasto} />
              </div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">%</th>
                    <th className="text-right">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPDF.gastosPorCategoria.map(cat => {
                    const percentual = dadosPDF.resumoFinanceiro.totalGastosObras > 0 
                      ? (cat.total / dadosPDF.resumoFinanceiro.totalGastosObras) * 100 
                      : 0;
                    return (
                      <tr key={cat.categoria}>
                        <td><strong>{cat.categoria}</strong></td>
                        <td className="text-right">{formatCurrency(cat.total)}</td>
                        <td className="text-right">{percentual.toFixed(1)}%</td>
                        <td className="text-right">{cat.transacoes}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td><strong>TOTAL OBRAS</strong></td>
                    <td className="text-right"><strong>{formatCurrency(dadosPDF.resumoFinanceiro.totalGastosObras)}</strong></td>
                    <td className="text-right"><strong>100%</strong></td>
                    <td className="text-right"><strong>{dadosPDF.gastosDetalhados.length}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DETAILED EXPENSES - OBRAS */}
            <div className="print-section">
              <h2>Gastos das Obras</h2>
              {dadosPDF.gastosOrganizadosPorObra.map((item) => (
                <div key={item.obra.id}>
                  {dadosPDF.multiplaObras && (
                    <div className="print-obra-header">
                      <h3>{item.obra.nome}</h3>
                      <p>Total: {formatCurrency(item.total)} • {item.gastos.length} item{item.gastos.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Etapas</th>
                        <th>Fornecedor</th>
                        <th className="text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.gastos.map(gasto => {
                        const categoria = categoriasGasto.find(c => c.id === gasto.categoria_id);
                        const subcategoria = subcategoriasGasto.find(s => s.id === gasto.subcategoria_id);
                        const fornecedor = fornecedores.find(f => f.id === gasto.fornecedor_id);
                        
                        const etapasNomes = gasto.etapa_obra_ids && gasto.etapa_obra_ids.length > 0
                          ? gasto.etapa_obra_ids
                              .map(etapaId => etapasObra.find(e => e.id === etapaId)?.nome)
                              .filter(Boolean)
                              .join(', ')
                          : '-';
                        
                        return (
                          <tr key={gasto.id}>
                            <td>{format(new Date(gasto.data_pagamento || gasto.data), 'dd/MM/yy')}</td>
                            <td>{gasto.descricao}</td>
                            <td>{categoria?.nome || '-'}</td>
                            <td>{subcategoria?.nome || '-'}</td>
                            <td>{etapasNomes}</td>
                            <td>{fornecedor?.nome || '-'}</td>
                            <td className="text-right">{formatCurrency(gasto.valor)}</td>
                          </tr>
                        );
                      })}
                      {dadosPDF.multiplaObras && (
                        <tr className="subtotal-row">
                          <td colSpan="6" className="text-right"><strong>Subtotal {item.obra.nome}:</strong></td>
                          <td className="text-right"><strong>{formatCurrency(item.total)}</strong></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
              
              {/* TOTAL DAS OBRAS */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
                borderRadius: '6px',
                border: '2px solid #1e40af'
              }}>
                <table style={{ width: '100%', marginBottom: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ 
                        color: 'white', 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        padding: '5px 8px'
                      }}>
                        🏗️ TOTAL GASTOS DAS OBRAS
                      </td>
                      <td style={{ 
                        color: 'white', 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        textAlign: 'right', 
                        padding: '5px 8px'
                      }}>
                        {formatCurrency(dadosPDF.resumoFinanceiro.totalGastosObras)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* GASTOS ADMINISTRATIVOS */}
            {dadosPDF.incluirGastosAdmin && dadosPDF.gastosAdministrativos.length > 0 && (
              <div className="print-section">
                <h2>Gastos Administrativos</h2>
                <div className="print-admin-section">
                  <h3>Despesas Operacionais da Empresa</h3>
                  <p style={{fontSize: '9px', color: '#5b21b6', marginTop: '5px'}}>
                    Custos administrativos não relacionados às obras específicas
                  </p>
                </div>
                
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Status</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosPDF.gastosAdministrativos.map(gasto => {
                      const categoriasLabel = {
                        contador: "Contador",
                        impostos: "Impostos",
                        aluguel: "Aluguel",
                        energia: "Energia Elétrica",
                        agua: "Água",
                        internet: "Internet",
                        telefone: "Telefone",
                        material_escritorio: "Material de Escritório",
                        software: "Software/Licenças",
                        manutencao: "Manutenção",
                        marketing: "Marketing",
                        juridico: "Jurídico",
                        outros: "Outros"
                      };
                      
                      return (
                        <tr key={gasto.id} className="admin-row">
                          <td>{format(new Date(gasto.data), 'dd/MM/yy')}</td>
                          <td>{gasto.descricao}</td>
                          <td>{categoriasLabel[gasto.categoria] || gasto.categoria}</td>
                          <td>{gasto.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}</td>
                          <td className="text-right">{formatCurrency(gasto.valor)}</td>
                        </tr>
                      );
                    })}
                    <tr className="subtotal-row">
                      <td colSpan="4" className="text-right"><strong>Total Gastos Administrativos:</strong></td>
                      <td className="text-right"><strong>{formatCurrency(dadosPDF.resumoFinanceiro.totalGastosAdmin)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TOTAL GERAL FINAL */}
            <div style={{ 
              marginTop: '25px', 
              padding: '20px 15px', 
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', 
              borderRadius: '8px',
              border: '3px solid #dc2626',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <table style={{ width: '100%', marginBottom: 0 }}>
                <tbody>
                  <tr>
                    <td style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      padding: '8px 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      💰 TOTAL GERAL DE GASTOS {dadosPDF.incluirGastosAdmin ? '(Obras + Administrativo)' : ''}
                    </td>
                    <td style={{ 
                      color: 'white', 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      textAlign: 'right', 
                      padding: '8px 10px'
                    }}>
                      {formatCurrency(dadosPDF.resumoFinanceiro.totalGeralGastos)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '10px', 
                      padding: '5px 10px 0 10px',
                      fontStyle: 'italic'
                    }}>
                      {dadosPDF.incluirGastosAdmin 
                        ? `Obras: ${formatCurrency(dadosPDF.resumoFinanceiro.totalGastosObras)} | Administrativo: ${formatCurrency(dadosPDF.resumoFinanceiro.totalGastosAdmin)}`
                        : `Total de ${dadosPDF.gastosDetalhados.length} lançamento${dadosPDF.gastosDetalhados.length !== 1 ? 's' : ''}`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="print-footer">
              <p>Relatório gerado por {workspaceInfo.name} em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}