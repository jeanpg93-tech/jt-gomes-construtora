import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { SubcategoriaGasto2 } from '@/entities/SubcategoriaGasto2';

export default function GerenciadorSubcategoria2({ categorias, subcategorias }) {
  const [subcategorias2, setSubcategorias2] = useState([]);
  const [newSubcategoria2, setNewSubcategoria2] = useState({ nome: '', subcategoria_id: '' });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ nome: '', subcategoria_id: '' });

  useEffect(() => {
    loadSubcategorias2();
  }, []);

  const loadSubcategorias2 = async () => {
    setLoading(true);
    try {
      const data = await SubcategoriaGasto2.list();
      setSubcategorias2(data);
    } catch (error) {
      console.error('Erro ao carregar subcategorias 2:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSubcategoria2.nome.trim() || !newSubcategoria2.subcategoria_id) return;
    try {
      await SubcategoriaGasto2.create({
        nome: newSubcategoria2.nome.trim(),
        subcategoria_id: newSubcategoria2.subcategoria_id
      });
      setNewSubcategoria2({ nome: '', subcategoria_id: '' });
      await loadSubcategorias2();
    } catch (error) {
      console.error('Erro ao adicionar subcategoria 2:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await SubcategoriaGasto2.delete(id);
      await loadSubcategorias2();
    } catch (error) {
      console.error('Erro ao excluir subcategoria 2:', error);
    }
  };

  const handleStartEditing = (subcategoria2) => {
    setEditingId(subcategoria2.id);
    setEditingData({ nome: subcategoria2.nome, subcategoria_id: subcategoria2.subcategoria_id });
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingData({ nome: '', subcategoria_id: '' });
  };

  const handleSaveEditing = async () => {
    if (!editingData.nome.trim() || !editingData.subcategoria_id || !editingId) return;
    try {
      await SubcategoriaGasto2.update(editingId, {
        nome: editingData.nome.trim(),
        subcategoria_id: editingData.subcategoria_id
      });
      handleCancelEditing();
      await loadSubcategorias2();
    } catch (error) {
      console.error('Erro ao atualizar subcategoria 2:', error);
    }
  };

  const getSubcategoriaName = (subcategoriaId) => {
    return subcategorias.find(s => s.id === subcategoriaId)?.nome || 'Subcategoria não encontrada';
  };

  const getCategoriaName = (subcategoriaId) => {
    const subcategoria = subcategorias.find(s => s.id === subcategoriaId);
    if (!subcategoria) return 'Categoria não encontrada';
    return categorias.find(c => c.id === subcategoria.categoria_id)?.nome || 'Categoria não encontrada';
  };

  const getFullPath = (subcategoriaId) => {
    const categoria = getCategoriaName(subcategoriaId);
    const subcategoria = getSubcategoriaName(subcategoriaId);
    return `${categoria} → ${subcategoria}`;
  };

  const groupedSubcategorias2 = subcategorias.map(subcategoria => ({
    subcategoria,
    categoria: categorias.find(c => c.id === subcategoria.categoria_id),
    subcategorias2: subcategorias2.filter(sub2 => sub2.subcategoria_id === subcategoria.id)
  })).filter(group => group.subcategorias2.length > 0);

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar nova subcategoria 2 */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="font-medium text-slate-800 mb-3">Adicionar Nova Subcategoria 2</h4>
        <div className="flex gap-2 flex-wrap">
          <Select 
            value={newSubcategoria2.subcategoria_id} 
            onValueChange={(value) => setNewSubcategoria2(prev => ({ ...prev, subcategoria_id: value }))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione a subcategoria" />
            </SelectTrigger>
            <SelectContent>
              {subcategorias.map(sub => (
                <SelectItem key={sub.id} value={sub.id}>
                  {getFullPath(sub.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Nome da nova subcategoria 2"
            value={newSubcategoria2.nome}
            onChange={(e) => setNewSubcategoria2(prev => ({ ...prev, nome: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-48"
          />
          <Button onClick={handleAdd} disabled={!newSubcategoria2.nome.trim() || !newSubcategoria2.subcategoria_id}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de subcategorias 2 agrupadas */}
      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {groupedSubcategorias2.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhuma subcategoria 2 cadastrada. Adicione uma subcategoria 2 acima.
            </p>
          ) : (
            groupedSubcategorias2.map(({ subcategoria, categoria, subcategorias2: subs2 }) => (
              <div key={subcategoria.id} className="border border-slate-200 rounded-lg">
                <div className="bg-slate-100 px-4 py-2 font-medium text-slate-800 rounded-t-lg">
                  {categoria?.nome} → {subcategoria.nome}
                </div>
                <div className="p-2 space-y-2">
                  {subs2.map(sub2 => (
                    <div key={sub2.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded">
                      {editingId === sub2.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select 
                            value={editingData.subcategoria_id} 
                            onValueChange={(value) => setEditingData(prev => ({ ...prev, subcategoria_id: value }))}
                          >
                            <SelectTrigger className="w-56">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategorias.map(sub => (
                                <SelectItem key={sub.id} value={sub.id}>
                                  {getFullPath(sub.id)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            value={editingData.nome} 
                            onChange={(e) => setEditingData(prev => ({ ...prev, nome: e.target.value }))}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing()}
                          />
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveEditing} aria-label="Salvar">
                              <Save className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEditing} aria-label="Cancelar">
                              <X className="w-4 h-4 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">{sub2.nome}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleStartEditing(sub2)} aria-label="Editar">
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sub2.id)} aria-label="Excluir">
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