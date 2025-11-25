
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, Search, DollarSign, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import ReceitaForm from "../components/receitas/ReceitaForm";
import ReceitaCard from "../components/receitas/ReceitaCard";

export default function Receitas() {
  const [receitas, setReceitas] = useState([]);
  const [obras, setObras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReceita, setEditingReceita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [receitaData, obraData, categoriaData] = await Promise.all([
        base44.entities.Receita.list('-created_date'),
        base44.entities.Obra.list('-created_date'),
        base44.entities.CategoriaReceita.list()
      ]);
      
      setReceitas(receitaData);
      setObras(obraData);
      setCategorias(categoriaData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      // Função para adicionar 1 dia à data
      const addOneDay = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Função para converter valor corretamente SEM perder precisão
      const parseValor = (valor) => {
        if (valor === null || valor === undefined || valor === '') return 0;
        
        // Se já for número, usa toFixed para garantir precisão
        if (typeof valor === 'number' && !isNaN(valor)) {
          return parseFloat(valor.toFixed(2));
        }
        
        // Se for string, processa
        if (typeof valor === 'string') {
          let valorLimpo = valor.trim().replace(/R\$/g, '').replace(/\s/g, '');
          
          if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
            valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
          }
          else if (valorLimpo.includes(',')) {
            valorLimpo = valorLimpo.replace(',', '.');
          }
          else if (valorLimpo.includes('.')) {
            const partes = valorLimpo.split('.');
            if (partes.length === 2 && partes[1].length === 2) {
              // É decimal, mantém
            } 
            else if (partes.length > 2 || (partes.length === 2 && partes[1].length !== 2)) {
              valorLimpo = valorLimpo.replace(/\./g, '');
            }
          }
          
          const numero = Number(valorLimpo);
          if (isNaN(numero)) return 0;
          return parseFloat(numero.toFixed(2));
        }
        
        return 0;
      };
      
      const processedData = {
        ...data,
        valor: parseValor(data.valor),
        data: addOneDay(data.data),
        data_vencimento: data.data_vencimento ? addOneDay(data.data_vencimento) : null,
        cliente: data.cliente || null,
        forma_pagamento: data.forma_pagamento || null,
        observacoes: data.observacoes || null,
        categoria_id: data.categoria_id || null,
        origem_registro: 'web'
      };
      
      if (editingReceita) {
        await base44.entities.Receita.update(editingReceita.id, processedData);
      } else {
        await base44.entities.Receita.create(processedData);
      }
      setShowForm(false);
      setEditingReceita(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
    }
  };

  const handleEdit = (receita) => {
    setEditingReceita(receita);
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
      setSelectedIds(new Set(filteredReceitas.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const deletePromises = Array.from(selectedIds).map(id => base44.entities.Receita.delete(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir receitas:", error);
    }
  };

  const filteredReceitas = receitas.filter(receita => {
    const matchesSearch = receita.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receita.cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObra = selectedObra === "all" || receita.obra_id === selectedObra;
    const matchesCategoria = selectedCategoria === "all" || receita.categoria_id === selectedCategoria;
    const matchesStatus = selectedStatus === "all" || receita.status === selectedStatus;

    return matchesSearch && matchesObra && matchesCategoria && matchesStatus;
  });

  const totalReceitas = filteredReceitas.reduce((sum, receita) => sum + (receita.valor || 0), 0);

  const getTipoLabel = (tipo) => {
    const labels = {
      venda: 'Venda',
      sinal: 'Sinal',
      parcela: 'Parcela',
      financiamento: 'Financiamento',
      aluguel: 'Aluguel',
      outros: 'Outros'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Receitas
          </h1>
          <p className="text-slate-600">
            Gerencie todas as receitas das suas obras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-4 py-2 border border-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-600">Total:</span>
              <span className="text-lg font-bold text-green-600">
                R$ {totalReceitas.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          {!isSelectMode ? (
            <>
              <Button variant="outline" onClick={() => setIsSelectMode(true)}>
                Selecionar
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Receita
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
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar receitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="prevista">Prevista</SelectItem>
                  <SelectItem value="recebida">Recebida</SelectItem>
                  <SelectItem value="atrasada">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <ReceitaForm
          receita={editingReceita}
          obras={obras}
          categorias={categorias}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingReceita(null);
          }}
        />
      )}

      {isSelectMode && (
        <div className="flex items-center space-x-2 p-3 bg-slate-100 rounded-lg border">
          <Checkbox 
            id="select-all-receitas" 
            onCheckedChange={handleSelectAll}
            checked={selectedIds.size > 0 && selectedIds.size === filteredReceitas.length}
          />
          <label htmlFor="select-all-receitas" className="text-sm font-medium leading-none">
            Selecionar todas ({selectedIds.size} de {filteredReceitas.length})
          </label>
        </div>
      )}

      {/* Lista de Receitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReceitas.map((receita) => (
          <ReceitaCard
            key={receita.id}
            receita={receita}
            obras={obras}
            categorias={categorias}
            onEdit={handleEdit}
            getTipoLabel={getTipoLabel}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(receita.id)}
            onSelectToggle={() => handleSelectToggle(receita.id)}
          />
        ))}
      </div>

      {filteredReceitas.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            Nenhuma receita encontrada
          </h3>
          <p className="text-slate-500 mb-4">
            Tente ajustar os filtros ou registre uma nova receita.
          </p>
        </div>
      )}
    </div>
  );
}
