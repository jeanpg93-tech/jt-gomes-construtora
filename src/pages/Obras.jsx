import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Search, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";

import ObraForm from "../components/obras/ObraForm";
import ObraCard from "../components/obras/ObraCard";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingObra, setEditingObra] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [gastos, setGastos] = useState([]);

  useEffect(() => {
    loadObras();
    loadGastos();
  }, []);

  const loadObras = async () => {
    try {
      const data = await base44.entities.Obra.list('-created_date');
      setObras(data);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGastos = async () => {
    try {
      const gastosData = await base44.entities.Gasto.list();
      setGastos(gastosData);
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
    }
  };

  // Calcular total de gastos por obra
  const calcularGastosPorObra = (obraId) => {
    return gastos
      .filter(g => g.obra_id === obraId)
      .reduce((sum, g) => sum + (g.valor || 0), 0);
  };

  // Enriquecer obras com dados de gastos
  const obrasEnriquecidas = obras.map(obra => ({
    ...obra,
    gastos_totais: calcularGastosPorObra(obra.id)
  }));

  const handleSave = async (data) => {
    try {
      if (editingObra) {
        await base44.entities.Obra.update(editingObra.id, data);
      } else {
        await base44.entities.Obra.create(data);
      }
      setShowForm(false);
      setEditingObra(null);
      loadObras();
      loadGastos();
    } catch (error) {
      console.error('Erro ao salvar obra:', error);
    }
  };

  const handleEdit = (obra) => {
    setEditingObra(obra);
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
      setSelectedIds(new Set(filteredObras.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const deletePromises = Array.from(selectedIds).map(id => base44.entities.Obra.delete(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      await loadObras();
      await loadGastos();
    } catch (error) {
      console.error("Erro ao excluir obras:", error);
    }
  };

  const filteredObras = obrasEnriquecidas.filter(obra =>
    obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando obras...</p>
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
            Obras
          </h1>
          <p className="text-slate-600">
            Gerencie todos os seus projetos de construção
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                Nova Obra
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar obras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <ObraForm
          obra={editingObra}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingObra(null);
          }}
        />
      )}

      {/* Select All Checkbox */}
      {isSelectMode && (
        <div className="flex items-center space-x-2 p-3 bg-slate-100 rounded-lg border">
          <Checkbox 
            id="select-all-obras" 
            onCheckedChange={handleSelectAll}
            checked={selectedIds.size > 0 && selectedIds.size === filteredObras.length}
          />
          <label htmlFor="select-all-obras" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Selecionar todas ({selectedIds.size} de {filteredObras.length})
          </label>
        </div>
      )}

      {/* Obras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredObras.map((obra) => (
          <ObraCard
            key={obra.id}
            obra={obra}
            onEdit={handleEdit}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(obra.id)}
            onSelectToggle={() => handleSelectToggle(obra.id)}
          />
        ))}
      </div>

      {filteredObras.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            {searchTerm ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece criando sua primeira obra'}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Obra
            </Button>
          )}
        </div>
      )}
    </div>
  );
}