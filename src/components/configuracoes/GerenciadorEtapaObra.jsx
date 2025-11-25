import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GerenciadorEtapaObra() {
  const [etapas, setEtapas] = useState([]);
  const [newEtapa, setNewEtapa] = useState({ nome: '', descricao: '' });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  useEffect(() => {
    loadEtapas();
  }, []);

  const loadEtapas = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.EtapaObra.list();
      const sortedData = data.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
      setEtapas(sortedData);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEtapa.nome.trim()) return;
    try {
      const maxOrdem = etapas.length > 0 ? Math.max(...etapas.map(e => e.ordem || 0)) : 0;
      await base44.entities.EtapaObra.create({
        nome: newEtapa.nome.trim(),
        descricao: newEtapa.descricao || null,
        ordem: maxOrdem + 1
      });
      setNewEtapa({ nome: '', descricao: '' });
      await loadEtapas();
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.EtapaObra.delete(id);
      await loadEtapas();
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
    }
  };

  const handleStartEditing = (etapa) => {
    setEditingId(etapa.id);
    setEditingData({ ...etapa });
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSaveEditing = async () => {
    if (!editingData.nome.trim() || !editingId) return;
    try {
      await base44.entities.EtapaObra.update(editingId, {
        nome: editingData.nome.trim(),
        descricao: editingData.descricao || null,
        ordem: editingData.ordem || 0
      });
      handleCancelEditing();
      await loadEtapas();
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newEtapas = [...etapas];
    [newEtapas[index - 1], newEtapas[index]] = [newEtapas[index], newEtapas[index - 1]];
    
    try {
      await Promise.all([
        base44.entities.EtapaObra.update(newEtapas[index - 1].id, { ...newEtapas[index - 1], ordem: index }),
        base44.entities.EtapaObra.update(newEtapas[index].id, { ...newEtapas[index], ordem: index + 1 })
      ]);
      await loadEtapas();
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
    }
  };

  const handleMoveDown = async (index) => {
    if (index === etapas.length - 1) return;
    const newEtapas = [...etapas];
    [newEtapas[index], newEtapas[index + 1]] = [newEtapas[index + 1], newEtapas[index]];
    
    try {
      await Promise.all([
        base44.entities.EtapaObra.update(newEtapas[index].id, { ...newEtapas[index], ordem: index + 1 }),
        base44.entities.EtapaObra.update(newEtapas[index + 1].id, { ...newEtapas[index + 1], ordem: index + 2 })
      ]);
      await loadEtapas();
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="font-medium text-slate-800 mb-3">Adicionar Nova Etapa da Obra</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600">Nome da Etapa *</label>
            <Input
              placeholder="Ex: Fundação, 1ª Laje, Reboco"
              value={newEtapa.nome}
              onChange={(e) => setNewEtapa(prev => ({ ...prev, nome: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-600">Descrição</label>
            <Input
              placeholder="Descrição da etapa (opcional)"
              value={newEtapa.descricao}
              onChange={(e) => setNewEtapa(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleAdd} 
          disabled={!newEtapa.nome.trim()}
          className="mt-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Etapa
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {etapas.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhuma etapa cadastrada. Adicione uma etapa acima.
            </p>
          ) : (
            etapas.map((etapa, index) => (
              <div key={etapa.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded">
                {editingId === etapa.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      value={editingData.nome} 
                      onChange={(e) => setEditingData(prev => ({ ...prev, nome: e.target.value }))}
                      className="flex-1"
                    />
                    <Input 
                      value={editingData.descricao || ''} 
                      onChange={(e) => setEditingData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição"
                      className="flex-1"
                    />
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
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-slate-400 font-mono text-sm">{index + 1}</span>
                      <div>
                        <span className="font-medium">{etapa.nome}</span>
                        {etapa.descricao && (
                          <p className="text-sm text-slate-500">{etapa.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleMoveDown(index)}
                        disabled={index === etapas.length - 1}
                      >
                        <ArrowDown className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleStartEditing(etapa)}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(etapa.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}