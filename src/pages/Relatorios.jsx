import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Download, PieChart, Briefcase, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

import RelatorioObra from "../components/relatorios/RelatorioObra";
import DetalheGastosCategoria from "../components/relatorios/DetalheGastosCategoria";
import MediaGastosCategoria from "../components/relatorios/MediaGastosCategoria";
import GraficoGastosPizza from "../components/relatorios/GraficoGastosPizza";
import {
  formatCurrency,
  filterByDate,
  buildCategoriaAnalytics,
  buildFiltersSummary,
  buildResumoObra,
} from "@/utils/relatorios";

export default function Relatorios() {
  const [obras, setObras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [gastosAdmin, setGastosAdmin] = useState([]);
  const [categoriasGasto, setCategoriasGasto] = useState([]);
  const [subcategoriasGasto, setSubcategoriasGasto] = useState([]);
  const [subcategoriasGasto2, setSubcategoriasGasto2] = useState([]);
  const [parcelas, setParcelas] = useState([]);
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
  const [hideRJ, setHideRJ] = useState(() => localStorage.getItem('_hrj') === '1');

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
        setSelectedObraIds(Array.isArray(ids) ? ids : [ids]);
      } catch {
        setSelectedObraIds([obraIdsParam]);
      }
    }
    const dataInicioParam = urlParams.get('dataInicio');
    if (dataInicioParam) setDataInicio(dataInicioParam);
    const dataFimParam = urlParams.get('dataFim');
    if (dataFimParam) setDataFim(dataFimParam);
  };

  const loadWorkspaceInfo = async () => {
    const user = await base44.auth.me();
    if (user) {
      setWorkspaceInfo({
        name: user.workspace_name || 'ConstrutoraPro',
        logoUrl: user.workspace_logo || null,
        cnpj: user.construtora_cnpj || null
      });
    }
  };

  const loadData = async () => {
    try {
      const [obraData, gastoData, receitaData, gastosAdminData, catGastoData, subcatGastoData, subcatGasto2Data, parcelaData, fornecedorData, etapaData] = await Promise.all([
        base44.entities.Obra.list('-created_date'),
        base44.entities.Gasto.list(),
        base44.entities.Receita.list(),
        base44.entities.GastoAdministrativo.list(),
        base44.entities.CategoriaGasto.list(),
        base44.entities.SubcategoriaGasto.list(),
        base44.entities.SubcategoriaGasto2.list(),
        base44.entities.ParcelaGasto.list(),
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
      setFornecedores(fornecedorData);
      setParcelas(parcelaData);
      setEtapasObra(etapaData.sort((a, b) => (a.ordem || 999) - (b.ordem || 999)));
    } finally {
      setLoading(false);
    }
  };

  const applyGeneralFilters = (items) => {
    let filtered = items;

    if (selectedStatusPagamento !== "all" && items.length > 0 && 'status_pagamento' in items[0]) {
      filtered = filtered.filter((item) => selectedStatusPagamento === 'pagos'
        ? item.status_pagamento === 'pago'
        : ['pendente', 'programado', 'atrasado'].includes(item.status_pagamento)
      );
    }

    if (selectedObraIds.length > 0) {
      filtered = filtered.filter((item) => selectedObraIds.includes(item.obra_id));
    }
    if (selectedCategoriaIds.length > 0) {
      filtered = filtered.filter((item) => selectedCategoriaIds.includes(item.categoria_id));
    }
    if (selectedSubcategoriaIds.length > 0) {
      filtered = filtered.filter((item) => selectedSubcategoriaIds.includes(item.subcategoria_id));
    }
    if (selectedSubcategoria2Ids.length > 0) {
      filtered = filtered.filter((item) => {
        const candidates = [
          item.subcategoria_2_id,
          item.subcategoria2_id,
          item.subcategoria_gasto2_id,
          item.subcategoria_gasto2,
          item.subcategoria_2,
        ];
        return candidates.some((v) => v && selectedSubcategoria2Ids.includes(v));
      });
    }
    if (selectedEtapaIds.length > 0) {
      filtered = filtered.filter((item) => selectedEtapaIds.some((id) => (item.etapa_obra_ids || []).includes(id)));
    }

    return filtered;
  };

  const gastosBase = hideRJ ? gastos.filter(g => !g.descricao?.toLowerCase().includes('retirada jean')) : gastos;
  const gastosComDataFiltrada = filterByDate(gastosBase, dataInicio, dataFim, (item) => item.data_pagamento || item.data);
  const gastosFiltrados = applyGeneralFilters(gastosComDataFiltrada);
  const gastosAdminFiltrados = filterByDate(gastosAdmin, dataInicio, dataFim, (item) => item.data);
  const receitasFiltradas = applyGeneralFilters(filterByDate(receitas, dataInicio, dataFim, (item) => item.data));
  const gastoIdsSelecionados = new Set(gastosFiltrados.map((g) => g.id));
  const parcelasSelecionadas = parcelas.filter((p) => gastoIdsSelecionados.has(p.gasto_id));

  const subcategoriasDisponiveis = selectedCategoriaIds.length === 0 ? [] : subcategoriasGasto.filter((sub) => selectedCategoriaIds.includes(sub.categoria_id));
  const subcategorias2Disponiveis = selectedSubcategoriaIds.length === 0 ? [] : subcategoriasGasto2.filter((sub2) => selectedSubcategoriaIds.includes(sub2.subcategoria_id));

  const selectedObras = obras.filter((obra) => selectedObraIds.includes(obra.id));
  const selectedObra = selectedObras[0];

  const categoriaAnalytics = buildCategoriaAnalytics({
    gastos: gastosFiltrados.filter((g) =>
      (selectedSubcategoriaIds.length === 0 || selectedSubcategoriaIds.includes(g.subcategoria_id)) &&
      (selectedSubcategoria2Ids.length === 0 || [g.subcategoria_2_id, g.subcategoria2_id, g.subcategoria_gasto2_id, g.subcategoria_gasto2, g.subcategoria_2].some(v => v && selectedSubcategoria2Ids.includes(v))) &&
      (selectedEtapaIds.length === 0 || (g.etapa_obra_ids || []).some(id => selectedEtapaIds.includes(id)))
    ),
    categorias: categoriasGasto.filter((categoria) => selectedCategoriaIds.length === 0 || selectedCategoriaIds.includes(categoria.id)),
    subcategorias: subcategoriasGasto,
    parcelas: parcelasSelecionadas,
  });

  const totalGrafico = categoriaAnalytics.reduce((sum, item) => sum + item.total, 0);
  const graficoData = categoriaAnalytics.map((categoria) => ({
    name: categoria.nome,
    value: categoria.total,
    pago: categoria.pago,
    pendente: categoria.pendente,
    percentual: totalGrafico > 0 ? (categoria.total / totalGrafico) * 100 : 0,
  }));

  const resumoFinanceiro = buildResumoObra({
    obra: selectedObra,
    gastos: gastosFiltrados,
    receitas: receitasFiltradas,
    parcelas: parcelasSelecionadas,
  });

  const filtrosResumo = buildFiltersSummary({
    obras: selectedObras.map((obra) => obra.nome),
    categorias: categoriasGasto.filter((categoria) => selectedCategoriaIds.includes(categoria.id)).map((categoria) => categoria.nome),
    subcategorias: subcategoriasGasto.filter((sub) => selectedSubcategoriaIds.includes(sub.id)).map((sub) => sub.nome),
    subcategorias2: subcategoriasGasto2.filter((sub) => selectedSubcategoria2Ids.includes(sub.id)).map((sub) => sub.nome),
    etapas: etapasObra.filter((etapa) => selectedEtapaIds.includes(etapa.id)).map((etapa) => etapa.nome),
    status: selectedStatusPagamento,
    dataInicio,
    dataFim,
    incluirGastosAdmin,
  });

  const definirPeriodoTotal = () => {
    if (!selectedObra?.data_inicio) return;
    setDataInicio(String(selectedObra.data_inicio).slice(0, 10));
    setDataFim(new Date().toISOString().slice(0, 10));
  };

  const handlePrint = () => window.print();

  const handleToggle = (setter, value) => setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="print-hide">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 
              className="text-3xl font-bold text-slate-800 mb-2 select-none cursor-default"
              onDoubleClick={() => {
                const next = !hideRJ;
                setHideRJ(next);
                localStorage.setItem('_hrj', next ? '1' : '0');
              }}
            >Relatórios{hideRJ ? <span className="text-slate-200 text-xs ml-1">•</span> : ''}</h1>
            <p className="text-slate-600">Analise o desempenho de suas obras.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
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
            <Button variant="outline" onClick={definirPeriodoTotal} disabled={!selectedObra?.data_inicio}>
              <CalendarRange className="w-4 h-4 mr-2" />
              Todo o período
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Selecionar Obras:</Label><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedObraIds(obras.filter(o => o.ativa !== false).map(o => o.id))} className="text-xs">Selecionar Todos</Button><Button variant="outline" size="sm" onClick={() => setSelectedObraIds([])} className="text-xs">Limpar</Button></div></div><div className="flex flex-wrap gap-2">{obras.filter(o => o.ativa !== false).map((obra) => <Button key={obra.id} variant={selectedObraIds.includes(obra.id) ? "default" : "outline"} size="sm" onClick={() => handleToggle(setSelectedObraIds, obra.id)}>{obra.nome}</Button>)}</div></CardContent></Card>

          <Card className="shadow-sm bg-purple-50 border-purple-200"><CardContent className="p-4"><div className="flex items-center space-x-2"><Checkbox id="incluir-gastos-admin" checked={incluirGastosAdmin} onCheckedChange={setIncluirGastosAdmin} /><label htmlFor="incluir-gastos-admin" className="text-sm font-medium cursor-pointer flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-600" />Incluir Gastos Administrativos no Relatório</label></div></CardContent></Card>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap"><Select value={selectedStatusPagamento} onValueChange={setSelectedStatusPagamento}><SelectTrigger className="w-full sm:w-auto bg-white"><SelectValue placeholder="Status de Pagamento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Status</SelectItem><SelectItem value="pagos">Pagos</SelectItem><SelectItem value="nao_pagos">Não Pagos</SelectItem></SelectContent></Select></div>

          <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Selecionar Categorias:</Label><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedCategoriaIds(categoriasGasto.map(c => c.id))} className="text-xs">Selecionar Todos</Button><Button variant="outline" size="sm" onClick={() => setSelectedCategoriaIds([])} className="text-xs">Limpar</Button></div></div><div className="flex flex-wrap gap-2">{categoriasGasto.map((cat) => <Button key={cat.id} variant={selectedCategoriaIds.includes(cat.id) ? "default" : "outline"} size="sm" onClick={() => handleToggle(setSelectedCategoriaIds, cat.id)}>{cat.nome}</Button>)}</div></CardContent></Card>

          {selectedCategoriaIds.length > 0 && subcategoriasDisponiveis.length > 0 && <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Selecionar Subcategorias 1:</Label><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedSubcategoriaIds(subcategoriasDisponiveis.map(s => s.id))} className="text-xs">Selecionar Todos</Button><Button variant="outline" size="sm" onClick={() => setSelectedSubcategoriaIds([])} className="text-xs">Limpar</Button></div></div><div className="flex flex-wrap gap-2">{subcategoriasDisponiveis.map((sub) => <Button key={sub.id} variant={selectedSubcategoriaIds.includes(sub.id) ? "default" : "outline"} size="sm" onClick={() => handleToggle(setSelectedSubcategoriaIds, sub.id)}>{sub.nome}</Button>)}</div></CardContent></Card>}

          {selectedSubcategoriaIds.length > 0 && subcategorias2Disponiveis.length > 0 && <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Selecionar Subcategorias 2:</Label><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedSubcategoria2Ids(subcategorias2Disponiveis.map(s => s.id))} className="text-xs">Selecionar Todos</Button><Button variant="outline" size="sm" onClick={() => setSelectedSubcategoria2Ids([])} className="text-xs">Limpar</Button></div></div><div className="flex flex-wrap gap-2">{subcategorias2Disponiveis.map((sub2) => <Button key={sub2.id} variant={selectedSubcategoria2Ids.includes(sub2.id) ? "default" : "outline"} size="sm" onClick={() => handleToggle(setSelectedSubcategoria2Ids, sub2.id)}>{sub2.nome}</Button>)}</div></CardContent></Card>}

          {selectedObraIds.length > 0 && <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Filtrar por Etapas da Obra:</Label><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedEtapaIds(etapasObra.map(e => e.id))} className="text-xs">Selecionar Todos</Button><Button variant="outline" size="sm" onClick={() => setSelectedEtapaIds([])} className="text-xs">Limpar</Button></div></div><div className="flex flex-wrap gap-2">{etapasObra.map((etapa) => <Button key={etapa.id} variant={selectedEtapaIds.includes(etapa.id) ? "default" : "outline"} size="sm" onClick={() => handleToggle(setSelectedEtapaIds, etapa.id)}>{etapa.nome}</Button>)}</div></CardContent></Card>}

          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto"><Download className="w-4 h-4 mr-2" />Exportar PDF</Button>
        </div>

        {obras.length === 0 ? <Card><CardContent className="p-12 text-center"><Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-semibold text-slate-700">Nenhuma obra encontrada</h3><p className="text-slate-500">Cadastre uma obra para começar a ver os relatórios.</p></CardContent></Card> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"><div className="lg:col-span-1 space-y-6">{selectedObraIds.length > 0 ? <RelatorioObra obra={selectedObra} obras={selectedObras.length > 1 ? selectedObras : null} gastos={gastosFiltrados} receitas={receitasFiltradas} workspaceInfo={workspaceInfo} parcelas={parcelasSelecionadas} /> : <Card><CardContent className="p-6 text-center"><Building2 className="w-12 h-12 mx-auto text-slate-300 mb-2" /><p className="text-slate-500 text-sm">Selecione uma ou mais obras para ver o resumo.</p></CardContent></Card>}</div><div className="lg:col-span-2 space-y-6"><Card className="shadow-lg border-0"><CardHeader><CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-600" />Distribuição de Gastos</CardTitle></CardHeader><CardContent><div className="h-[350px]"><GraficoGastosPizza dados={graficoData} /></div></CardContent></Card><DetalheGastosCategoria categorias={categoriaAnalytics} gastos={gastosFiltrados} parcelas={parcelasSelecionadas} /><MediaGastosCategoria categorias={categoriaAnalytics} /></div></div>}
      </div>

      <div className="print-show" style={{ display: 'none' }}>
        {selectedObraIds.length > 0 && (
          <div className="print-content">
            {/* Cabeçalho */}
            <div className="print-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                {workspaceInfo.logoUrl && (
                  <img src={workspaceInfo.logoUrl} alt="Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
                )}
                <div>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{workspaceInfo.name}</h1>
                  {workspaceInfo.cnpj && <p style={{ margin: '2px 0', fontSize: '11px', color: '#475569' }}>CNPJ: {workspaceInfo.cnpj}</p>}
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#475569' }}>Gestão e Controle de Obras</p>
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <p className="print-info"><strong>Obras:</strong> {selectedObras.map(o => o.nome).join(', ')}</p>
                <p className="print-info"><strong>Período:</strong> {dataInicio && dataFim ? `${format(new Date(`${dataInicio}T12:00:00`), 'dd/MM/yyyy')} a ${format(new Date(`${dataFim}T12:00:00`), 'dd/MM/yyyy')}` : 'Período completo'}</p>
                <p className="print-info"><strong>Gerado em:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="print-section">
              <h2>Resumo Financeiro</h2>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td><strong>Gastos Pagos</strong></td>
                    <td className="text-right text-red">{formatCurrency(resumoFinanceiro.gastosPagos)}</td>
                    <td><strong>Gastos Pendentes</strong></td>
                    <td className="text-right" style={{ color: '#f59e0b' }}>{formatCurrency(resumoFinanceiro.gastosAPagar)}</td>
                  </tr>
                  <tr>
                    <td><strong>Total de Despesas</strong></td>
                    <td className="text-right text-red">{formatCurrency(resumoFinanceiro.totalDespesas)}</td>
                    <td><strong>Total de Receitas</strong></td>
                    <td className="text-right text-green">{formatCurrency(resumoFinanceiro.totalReceitas)}</td>
                  </tr>
                  <tr>
                    <td><strong>Terreno Pago</strong></td>
                    <td className="text-right">{formatCurrency(resumoFinanceiro.totalTerrenoPago)}</td>
                    <td><strong>Terreno Pendente</strong></td>
                    <td className="text-right" style={{ color: '#f59e0b' }}>{formatCurrency(resumoFinanceiro.totalTerrenoPendente)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={2}><strong>Lucro Estimado (Venda Projetada - Despesas)</strong></td>
                    <td colSpan={2} className={`text-right ${resumoFinanceiro.lucroEstimadoAtual >= 0 ? 'text-green' : 'text-red'}`} style={{ fontSize: '14px' }}>
                      <strong>{formatCurrency(resumoFinanceiro.lucroEstimadoAtual)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Filtros Aplicados */}
            <div className="print-section">
              <h2>Filtros Aplicados</h2>
              <table className="print-table">
                <tbody>
                  {filtrosResumo.map((filtro) => (
                    <tr key={filtro.label}>
                      <td style={{ width: '30%' }}><strong>{filtro.label}</strong></td>
                      <td>{filtro.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico e Distribuição por Categoria */}
            <div className="print-section">
              <h2>Distribuição de Gastos por Categoria</h2>
              {graficoData.filter(d => d.value > 0).length > 0 && (
                <div className="print-chart-container">
                  <GraficoGastosPizza dados={graficoData} />
                </div>
              )}
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="text-right">Pago</th>
                    <th className="text-right">Pendente</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriaAnalytics.map((cat) => (
                    <React.Fragment key={cat.id}>
                      <tr>
                        <td><strong>{cat.nome}</strong></td>
                        <td className="text-right text-red">{formatCurrency(cat.pago)}</td>
                        <td className="text-right" style={{ color: '#f59e0b' }}>{formatCurrency(cat.pendente)}</td>
                        <td className="text-right"><strong>{formatCurrency(cat.total)}</strong></td>
                        <td className="text-right">{graficoData.find(i => i.name === cat.nome)?.percentual.toFixed(1)}%</td>
                      </tr>
                      {cat.subcategorias?.map(sub => (
                        <tr key={sub.id} style={{ backgroundColor: '#f8fafc' }}>
                          <td style={{ paddingLeft: '24px', color: '#64748b' }}>↳ {sub.nome}</td>
                          <td className="text-right" style={{ color: '#64748b' }}>{formatCurrency(sub.pago)}</td>
                          <td className="text-right" style={{ color: '#64748b' }}>{formatCurrency(sub.pendente)}</td>
                          <td className="text-right" style={{ color: '#64748b' }}>{formatCurrency(sub.total)}</td>
                          <td className="text-right" style={{ color: '#64748b' }}></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="total-row">
                    <td><strong>TOTAL GERAL</strong></td>
                    <td className="text-right text-red"><strong>{formatCurrency(resumoFinanceiro.gastosPagos)}</strong></td>
                    <td className="text-right" style={{ color: '#f59e0b' }}><strong>{formatCurrency(resumoFinanceiro.gastosAPagar)}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(resumoFinanceiro.totalDespesas)}</strong></td>
                    <td className="text-right"><strong>100%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detalhamento dos gastos por categoria */}
            {categoriaAnalytics.map((cat) => {
              const gastosCategoria = gastosFiltrados.filter(g => g.categoria_id === cat.id);
              if (!gastosCategoria.length) return null;
              return (
                <div className="print-section" key={cat.id}>
                  <h2>Detalhamento — {cat.nome}</h2>
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th>Data</th>
                        <th>Fornecedor</th>
                        <th className="text-right">Valor</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosCategoria.map(g => {
                        const forn = fornecedores.find(f => f.id === g.fornecedor_id);
                        const statusClass = g.status_pagamento === 'pago' ? 'status-pago' : g.status_pagamento === 'atrasado' ? 'status-atrasado' : g.status_pagamento === 'programado' ? 'status-programado' : 'status-pendente';
                        const statusLabel = { pago: 'Pago', pendente: 'Pendente', programado: 'Programado', atrasado: 'Atrasado' }[g.status_pagamento] || g.status_pagamento;
                        return (
                          <tr key={g.id}>
                            <td>{g.descricao}</td>
                            <td>{g.data ? format(new Date(`${g.data}T12:00:00`), 'dd/MM/yyyy') : '-'}</td>
                            <td>{forn?.nome || '-'}</td>
                            <td className="text-right">{formatCurrency(g.valor)}</td>
                            <td className={`text-center ${statusClass}`}>{statusLabel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', textAlign: 'center' }}>
              <p className="print-info">Relatório gerado por {workspaceInfo.name} em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}