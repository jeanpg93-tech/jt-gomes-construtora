import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GerenciadorMaterial({ categorias, subcategorias }) {
  const [materiais, setMateriais] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ 
    nome: '', 
    unidade_medida: 'un',
    subcategoria_gasto_id: '',
    custo_medio: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Material.list();
      setMateriais(data);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMaterial.nome.trim() || !newMaterial.subcategoria_gasto_id) return;
    try {
      await base44.entities.Material.create({
        nome: newMaterial.nome.trim(),
        unidade_medida: newMaterial.unidade_medida,
        subcategoria_gasto_id: newMaterial.subcategoria_gasto_id,
        custo_medio: newMaterial.custo_medio ? parseFloat(newMaterial.custo_medio) : null,
        observacoes: newMaterial.observacoes || null
      });
      setNewMaterial({ 
        nome: '', 
        unidade_medida: 'un',
        subcategoria_gasto_id: '',
        custo_medio: '',
        observacoes: ''
      });
      await loadMateriais();
    } catch (error) {
      console.error('Erro ao adicionar material:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Material.delete(id);
      await loadMateriais();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
    }
  };

  const handleStartEditing = (material) => {
    setEditingId(material.id);
    setEditingData({ ...material });
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSaveEditing = async () => {
    if (!editingData.nome.trim() || !editingData.subcategoria_gasto_id || !editingId) return;
    try {
      await base44.entities.Material.update(editingId, {
        nome: editingData.nome.trim(),
        unidade_medida: editingData.unidade_medida,
        subcategoria_gasto_id: editingData.subcategoria_gasto_id,
        custo_medio: editingData.custo_medio ? parseFloat(editingData.custo_medio) : null,
        observacoes: editingData.observacoes || null
      });
      handleCancelEditing();
      await loadMateriais();
    } catch (error) {
      console.error('Erro ao atualizar material:', error);
    }
  };

  const getSubcategoriaName = (subcategoriaId) => {
    const sub = subcategorias.find(s => s.id === subcategoriaId);
    if (!sub) return 'Subcategoria não encontrada';
    const cat = categorias.find(c => c.id === sub.categoria_id);
    return `${cat?.nome || '?'} → ${sub.nome}`;
  };

  const unidadesMedida = [
    { value: 'un', label: 'Unidade (un)' },
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'm', label: 'Metro (m)' },
    { value: 'm2', label: 'Metro² (m²)' },
    { value: 'm3', label: 'Metro³ (m³)' },
    { value: 'sc', label: 'Saco (sc)' },
    { value: 'cx', label: 'Caixa (cx)' },
    { value: 'pc', label: 'Peça (pc)' },
    { value: 'lt', label: 'Litro (lt)' }
  ];

  const groupedMateriais = subcategorias.map(sub => ({
    subcategoria: sub,
    categoria: categorias.find(c => c.id === sub.categoria_id),
    materiais: materiais.filter(mat => mat.subcategoria_gasto_id === sub.id)
  })).filter(group => group.materiais.length > 0);

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar novo material */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="font-medium text-slate-800 mb-3">Adicionar Novo Material</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600">Subcategoria *</label>
            <Select 
              value={newMaterial.subcategoria_gasto_id} 
              onValueChange={(value) => setNewMaterial(prev => ({ ...prev, subcategoria_gasto_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a subcategoria" />
              </SelectTrigger>
              <SelectContent>
                {subcategorias.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{getSubcategoriaName(sub.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-slate-600">Nome do Material *</label>
            <Input
              placeholder="Ex: Sarrafo, Cimento CP-II"
              value={newMaterial.nome}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Unidade de Medida *</label>
            <Select 
              value={newMaterial.unidade_medida} 
              onValueChange={(value) => setNewMaterial(prev => ({ ...prev, unidade_medida: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unidadesMedida.map(un => (
                  <SelectItem key={un.value} value={un.value}>{un.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Custo Médio (opcional)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={newMaterial.custo_medio}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, custo_medio: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Observações</label>
            <Input
              placeholder="Observações sobre o material"
              value={newMaterial.observacoes}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleAdd} 
          disabled={!newMaterial.nome.trim() || !newMaterial.subcategoria_gasto_id}
          className="mt-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Material
        </Button>
      </div>

      {/* Lista de materiais agrupados */}
      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {groupedMateriais.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhum material cadastrado. Adicione um material acima.
            </p>
          ) : (
            groupedMateriais.map(({ subcategoria, categoria, materiais: mats }) => (
              <div key={subcategoria.id} className="border border-slate-200 rounded-lg">
                <div className="bg-slate-100 px-4 py-2 font-medium text-slate-800 rounded-t-lg">
                  {categoria?.nome} → {subcategoria.nome}
                </div>
                <div className="p-2 space-y-2">
                  {mats.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded">
                      {editingId === mat.id ? (
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <Input 
                            value={editingData.nome} 
                            onChange={(e) => setEditingData(prev => ({ ...prev, nome: e.target.value }))}
                            className="flex-1 min-w-[150px]"
                          />
                          <Select 
                            value={editingData.unidade_medida} 
                            onValueChange={(value) => setEditingData(prev => ({ ...prev, unidade_medida: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unidadesMedida.map(un => (
                                <SelectItem key={un.value} value={un.value}>{un.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveEditing}>
                              <Save className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEditing}>
                              <X className="w-4 h-4 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="font-medium">{mat.nome}</span>
                            <span className="text-slate-500 text-sm ml-2">({mat.unidade_medida})</span>
                            {mat.custo_medio && (
                              <span className="text-slate-600 text-sm ml-2">
                                ~ R$ {mat.custo_medio.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleStartEditing(mat)}>
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(mat.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}