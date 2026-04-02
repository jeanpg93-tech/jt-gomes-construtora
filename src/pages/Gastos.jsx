import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client"; // Corrected import for base44
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingDown, Search, DollarSign, Trash2, X, LayoutGrid, List, FileSpreadsheet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { isBefore, isToday } from "date-fns";

import GastoForm from "../components/gastos/GastoForm";
import GastoCard from "../components/gastos/GastoCard";
import GastoListItem from "../components/gastos/GastoListItem";

// Função para adicionar delay entre chamadas API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [obras, setObras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [etapasObra, setEtapasObra] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set()); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [selectedSubcategoria, setSelectedSubcategoria] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState('grid');


  const verificarEAtualizarGastosAtrasados = async (gastosList) => {
    const hoje = new Date();
    const gastosParaAtualizar = [];
    
    gastosList.forEach(gasto => {
      if (gasto.status_pagamento === 'programado' && gasto.data_vencimento) {
        const dataVencimento = new Date(gasto.data_vencimento);
        if (isBefore(dataVencimento, hoje) && !isToday(dataVencimento)) {
          gastosParaAtualizar.push({
            ...gasto,
            status_pagamento: 'atrasado'
          });
        }
      }
    });

    if (gastosParaAtualizar.length > 0) {
      try {
        // Processar atualizações com delay para evitar rate limit
        for (const gasto of gastosParaAtualizar) {
          await base44.entities.Gasto.update(gasto.id, { status_pagamento: 'atrasado' });
          await delay(100); // 100ms de delay entre atualizações
        }
        
        return gastosList.map(gasto => {
          const gastoAtualizado = gastosParaAtualizar.find(g => g.id === gasto.id);
          return gastoAtualizado || gasto;
        });
      } catch (error) {
        console.error('Erro ao atualizar gastos atrasados:', error);
        return gastosList;
      }
    }

    return gastosList;
  };

  const gerarProximoNumeroSequencial = async () => {
    try {
      // Fetch all gastos to find the highest sequential number.
      // Adjust the limit if you expect more than 10000 gastos and want to be sure.
      const todosGastos = await base44.entities.Gasto.list('-created_date', 10000); 
      
      let maiorNumero = 0;
      todosGastos.forEach(gasto => {
        if (gasto.numero_sequencial) {
          // Remove '#' and parse to integer
          const numero = parseInt(gasto.numero_sequencial.replace('#', ''));
          if (!isNaN(numero) && numero > maiorNumero) {
            maiorNumero = numero;
          }
        }
      });
      
      const proximoNumero = maiorNumero + 1;
      return `#${String(proximoNumero).padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar número sequencial:', error);
      // Fallback in case of error
      return '#0001';
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fazer as chamadas sequencialmente com delay para evitar rate limit
      const obraData = await base44.entities.Obra.list('-created_date');
      await delay(200);
      
      const categoriaData = await base44.entities.CategoriaGasto.list();
      await delay(200);
      
      const subcategoriaData = await base44.entities.SubcategoriaGasto.list();
      await delay(200);
      
      const etapaData = await base44.entities.EtapaObra.list(); 
      await delay(200);
      
      const fornecedorData = await base44.entities.Fornecedor.list();
      await delay(200);

      const gastoData = await base44.entities.Gasto.list('-created_date');
      
      const gastosAtualizados = await verificarEAtualizarGastosAtrasados(gastoData);
      
      setGastos(gastosAtualizados);
      setObras(obraData);
      setCategorias(categoriaData);
      setSubcategorias(subcategoriaData);
      setEtapasObra(etapaData.sort((a, b) => (a.ordem || 999) - (b.ordem || 999))); // Set etapasObra state
      setFornecedores(fornecedorData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, tentar novamente após 2 segundos
      setTimeout(() => {
        console.log('Tentando recarregar dados...');
        loadData();
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data) => {
    try {
      // Função para converter valor corretamente SEM perder precisão
      const parseValor = (valor) => {
        if (valor === null || valor === undefined || valor === '') return 0;
        
        // Se já for número, usa toFixed para garantir precisão
        if (typeof valor === 'number' && !isNaN(valor)) {
          return parseFloat(valor.toFixed(2));
        }
        
        // Se for string, processa
        if (typeof valor === 'string') {
          // Remove espaços e R$
          let valorLimpo = valor.trim().replace(/R\$/g, '').replace(/\s/g, '');
          
          // Se tiver vírgula E ponto, remove os pontos (são milhares) e troca vírgula por ponto
          if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
            valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
          }
          // Se tiver só vírgula, troca por ponto
          else if (valorLimpo.includes(',')) {
            valorLimpo = valorLimpo.replace(',', '.');
          }
          // Se tiver só ponto, verifica se é decimal ou milhar
          else if (valorLimpo.includes('.')) {
            const partes = valorLimpo.split('.');
            // Se a última parte tem exatamente 2 dígitos, é decimal
            if (partes.length === 2 && partes[1].length === 2) {
              // É decimal, mantém
            } 
            // Se tem mais de 2 casas ou 1 casa, pode ser milhar (remove pontos de milhar)
            else if (partes.length > 2 || (partes.length === 2 && partes[1].length !== 2)) {
              valorLimpo = valorLimpo.replace(/\./g, '');
            }
          }
          
          // Usa Number() e toFixed() para garantir precisão
          const numero = Number(valorLimpo);
          if (isNaN(numero)) return 0;
          return parseFloat(numero.toFixed(2));
        }
        
        return 0;
      };

      // Gerar número sequencial se for um novo gasto
      let numeroSequencial = data.numero_sequencial;
      if (!editingGasto || !editingGasto.id) {
        numeroSequencial = await gerarProximoNumeroSequencial();
      }
      
      const processedData = {
        numero_sequencial: numeroSequencial,
        obra_id: data.obra_id,
        descricao: data.descricao,
        categoria_id: data.categoria_id,
        subcategoria_id: data.subcategoria_id || null,
        etapa_obra_ids: data.etapa_obra_ids && data.etapa_obra_ids.length > 0 ? data.etapa_obra_ids : null,
        valor: parseValor(data.valor),
        data: data.data,
        data_vencimento: data.data_vencimento || null,
        data_pagamento: data.data_pagamento || null,
        fornecedor_id: data.fornecedor_id || null,
        forma_pagamento: data.forma_pagamento || null,
        status_pagamento: data.status_pagamento,
        observacoes: data.observacoes || null,
        arquivo_anexo: data.arquivo_anexo || null,
        origem_registro: 'web',
        eh_recorrente: !!data.eh_recorrente,
        valor_total_recorrencia: data.eh_recorrente && data.valor_total_recorrencia !== null && data.valor_total_recorrencia !== '' ? parseValor(data.valor_total_recorrencia) : null,
        valor_entrada: data.eh_recorrente && data.valor_entrada !== null && data.valor_entrada !== '' ? parseValor(data.valor_entrada) : null,
        quantidade_parcelas: data.eh_recorrente && data.quantidade_parcelas ? Number(data.quantidade_parcelas) : null
      };
      
      // Verifica se tem ID válido para decidir entre update ou create
      let savedGastoId = editingGasto?.id;

      if (editingGasto && editingGasto.id) {
        await base44.entities.Gasto.update(editingGasto.id, processedData);
        savedGastoId = editingGasto.id;
        await delay(200);
      } else {
        const createdGasto = await base44.entities.Gasto.create(processedData);
        savedGastoId = createdGasto.id;
        await delay(200);
      }

      if (data.eh_recorrente && savedGastoId) {
        const parcelasExistentes = await base44.entities.ParcelaGasto.filter({ gasto_id: savedGastoId });
        for (const parcela of parcelasExistentes) {
          await base44.entities.ParcelaGasto.delete(parcela.id);
          await delay(50);
        }

        const parcelasParaCriar = (data.parcelas_recorrencia || [])
          .filter((item) => item.data_vencimento)
          .map((item) => ({
            gasto_id: savedGastoId,
            numero_parcela: item.numero_parcela,
            descricao: `${data.descricao} - Parcela ${item.numero_parcela}`,
            valor: parseValor(item.valor),
            data_vencimento: item.data_vencimento,
            data_pagamento: item.status === 'pago' ? (item.data_pagamento || item.data_vencimento || null) : null,
            status: item.status || 'programado'
          }));

        if (parcelasParaCriar.length > 0) {
          await base44.entities.ParcelaGasto.bulkCreate(parcelasParaCriar);
          await delay(200);
        }
      }

      setShowForm(false);
      setEditingGasto(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      alert('Erro ao salvar gasto. Tente novamente em alguns segundos.');
    }
  };

  const handleEdit = (gasto) => {
    setEditingGasto(gasto);
    setShowForm(true);
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDuplicate = (gasto) => {
    // Remove o ID e a data de criação para criar um novo registro
    const gastoDuplicado = {
      ...gasto,
      id: undefined, // Explicitly set ID to undefined to ensure it's treated as a new record
      created_date: undefined,
      created_by: undefined,
      updated_date: undefined,
      data: getTodayDate(), // Usa a data de hoje para o duplicado
      numero_sequencial: undefined // Clear sequential number so a new one is generated
    };
    setEditingGasto(gastoDuplicado);
    setShowForm(true);
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => {
      const newSelectedIds = new Set(prev);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredGastos.map(g => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      // Deletar um por vez com delay para evitar rate limit
      for (const id of selectedIds) {
        await base44.entities.Gasto.delete(id);
        await delay(200); // 200ms de delay entre exclusões
      }
      
      setSelectedIds(new Set());
      setIsSelectMode(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir gastos:', error);
      alert('Erro ao excluir gastos. Alguns itens podem não ter sido excluídos.');
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "ID", "Numero_Sequencial", "Obra", "Descrição", "Categoria", "Tipo", "Valor", "Data", "Data Vencimento",
      "Data Pagamento", "Fornecedor", "Forma Pagamento", "Status Pagamento", "Observações"
    ];

    const data = filteredGastos.map(gasto => {
      const obraNome = obras.find(o => o.id === gasto.obra_id)?.nome || 'N/A';
      const categoriaNome = categorias.find(c => c.id === gasto.categoria_id)?.nome || 'N/A';
      const subcategoriaNome = subcategorias.find(s => s.id === gasto.subcategoria_id)?.nome || 'N/A';
      const fornecedorNome = fornecedores.find(f => f.id === gasto.fornecedor_id)?.nome || '';
      // If gasto.etapas_ids (array of IDs) exists:
      // const etapasNomes = gasto.etapas_ids?.map(etapaId => etapasObra.find(e => e.id === etapaId)?.nome).filter(Boolean).join(', ') || '';

      return [
        gasto.id,
        gasto.numero_sequencial || '', // Add sequential number
        obraNome,
        gasto.descricao,
        categoriaNome,
        subcategoriaNome,
        gasto.valor,
        gasto.data,
        gasto.data_vencimento || '',
        gasto.data_pagamento || '',
        fornecedorNome, // Using lookup from fornecedores list
        gasto.forma_pagamento || '',
        gasto.status_pagamento,
        gasto.observacoes || '',
        // Add etapasNomes here if needed
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...data].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gastos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateSummaryReport = () => {
    const obraNome = selectedObra === "all" ? "Todas as Obras" : obras.find(o => o.id === selectedObra)?.nome || 'N/A';
    const categoriaNome = selectedCategoria === "all" ? "Todas as Categorias" : categorias.find(c => c.id === selectedCategoria)?.nome || 'N/A';
    const subcategoriaNome = selectedSubcategoria === "all" ? "Todos os Tipos" : subcategorias.find(s => s.id === selectedSubcategoria)?.nome || 'N/A';
    const statusNome = selectedStatus === "all" ? "Todos os Status" : selectedStatus;

    let reportText = `Relatório de Gastos (Filtros Atuais)\n`;
    reportText += `--------------------------------------\n`;
    reportText += `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    reportText += `Total de Gastos: R$ ${totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    reportText += `Número de Itens: ${filteredGastos.length}\n\n`;
    reportText += `Filtros Aplicados:\n`;
    reportText += `  Obra: ${obraNome}\n`;
    reportText += `  Categoria: ${categoriaNome}\n`;
    reportText += `  Tipo: ${subcategoriaNome}\n`;
    reportText += `  Status: ${statusNome}\n`;
    if (searchTerm) {
      reportText += `  Busca: "${searchTerm}"\n`;
    }
    reportText += `\n--------------------------------------\n`;
    reportText += `Este é um resumo dos gastos filtrados. Para detalhes, exporte para Excel.`;

    alert(reportText); // A simple alert for the summary report. Could be expanded to a modal or PDF generation.
  };

  const filteredGastos = gastos.filter(gasto => {
    const matchesSearch = gasto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (gasto.numero_sequencial && gasto.numero_sequencial.toLowerCase().includes(searchTerm.toLowerCase())) || // Add sequential number to search
                         (gasto.fornecedor_id && fornecedores.find(f => f.id === gasto.fornecedor_id)?.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         gasto.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObra = selectedObra === "all" || gasto.obra_id === selectedObra;
    const matchesCategoria = selectedCategoria === "all" || gasto.categoria_id === selectedCategoria;
    const matchesSubcategoria = selectedSubcategoria === "all" || gasto.subcategoria_id === selectedSubcategoria;
    const matchesStatus = selectedStatus === "all" || gasto.status_pagamento === selectedStatus;

    return matchesSearch && matchesObra && matchesCategoria && matchesSubcategoria && matchesStatus;
  });

  const totalGastos = filteredGastos.reduce((sum, gasto) => sum + (gasto.valor || 0), 0);

  // Filtrar subcategorias baseado na categoria selecionada
  const subcategoriasDisponiveis = selectedCategoria === "all" 
    ? subcategorias 
    : subcategorias.filter(sub => sub.categoria_id === selectedCategoria);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando dados...</p>
          <p className="text-xs text-slate-400 mt-2">Aguarde, estamos organizando suas informações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Gastos
          </h1>
          <p className="text-slate-600">
            Controle todas as despesas das suas obras
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white rounded-lg px-4 py-2 border border-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-slate-600">Total:</span>
              <span className="lg:text-lg font-bold text-red-600">
                R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {!isSelectMode ? (
            <>
              <Button variant="outline" onClick={handleGenerateSummaryReport}>
                Gerar Relatório
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>              
              <Button variant="outline" onClick={() => setIsSelectMode(true)}>
                Selecionar
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Gasto
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDeleteSelected} disabled={selectedIds.size === 0}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir ({selectedIds.size})
              </Button>
              <Button variant="ghost" onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg border-0 print-hide">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-3 w-full md:w-auto flex-wrap">
                <Select value={selectedObra} onValueChange={setSelectedObra}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Obra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Obras</SelectItem>
                    {obras.filter(o => o.ativa !== false).map(obra => (
                      <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategoria} onValueChange={(value) => {
                  setSelectedCategoria(value);
                  setSelectedSubcategoria("all"); // Reset subcategoria quando categoria muda
                }}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subcategoria - só aparece se tem categoria selecionada e subcategorias disponíveis */}
                {selectedCategoria !== "all" && subcategoriasDisponiveis.length > 0 && (
                  <Select value={selectedSubcategoria} onValueChange={setSelectedSubcategoria}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Subcategorias</SelectItem>
                      {subcategoriasDisponiveis.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 hidden md:flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <GastoForm
          gasto={editingGasto}
          obras={obras}
          categorias={categorias}
          etapasObra={etapasObra} // Pass etapasObra to GastoForm
          fornecedores={fornecedores} // Pass fornecedores to GastoForm
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGasto(null);
          }}
        />
      )}

      {isSelectMode && (
        <div className="flex items-center space-x-2 p-3 bg-slate-100 rounded-lg border">
          <Checkbox 
            id="select-all-gastos" 
            onCheckedChange={handleSelectAll}
            checked={selectedIds.size > 0 && selectedIds.size === filteredGastos.length}
          />
          <label htmlFor="select-all-gastos" className="text-sm font-medium leading-none">
            Selecionar todos ({selectedIds.size} de {filteredGastos.length})
          </label>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGastos.map((gasto) => (
            <GastoCard
              key={gasto.id}
              gasto={gasto}
              obras={obras}
              categorias={categorias}
              subcategorias={subcategorias}
              etapasObra={etapasObra} // Pass etapasObra to GastoCard
              fornecedores={fornecedores}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(gasto.id)}
              onSelectToggle={() => handleSelectToggle(gasto.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredGastos.map((gasto) => (
                <GastoListItem
                  key={gasto.id}
                  gasto={gasto}
                  obras={obras}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  etapasObra={etapasObra} // Pass etapasObra to GastoListItem
                  fornecedores={fornecedores}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(gasto.id)}
                  onSelectToggle={() => handleSelectToggle(gasto.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredGastos.length === 0 && (
        <div className="text-center py-12">
          <TrendingDown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            Nenhum gasto encontrado
          </h3>
          <p className="text-slate-500 mb-4">
            Tente ajustar os filtros ou registre um novo gasto.
          </p>
        </div>
      )}
    </div>
  );
}