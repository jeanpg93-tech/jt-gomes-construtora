import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GerenciadorSubcategoria({ categorias }) {
  const [subcategorias, setSubcategorias] = useState([]);
  const [newSubcategoria, setNewSubcategoria] = useState({ nome: '', categoria_id: '' });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ nome: '', categoria_id: '' });

  useEffect(() => {
    loadSubcategorias();
  }, []);

  const loadSubcategorias = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SubcategoriaGasto.list();
      setSubcategorias(data);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSubcategoria.nome.trim() || !newSubcategoria.categoria_id) return;
    try {
      await base44.entities.SubcategoriaGasto.create({
        nome: newSubcategoria.nome.trim(),
        categoria_id: newSubcategoria.categoria_id
      });
      setNewSubcategoria({ nome: '', categoria_id: '' });
      await loadSubcategorias();
    } catch (error) {
      console.error('Erro ao adicionar tipo:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.SubcategoriaGasto.delete(id);
      await loadSubcategorias();
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
    }
  };

  const handleStartEditing = (subcategoria) => {
    setEditingId(subcategoria.id);
    setEditingData({ nome: subcategoria.nome, categoria_id: subcategoria.categoria_id });
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingData({ nome: '', categoria_id: '' });
  };

  const handleSaveEditing = async () => {
    if (!editingData.nome.trim() || !editingData.categoria_id || !editingId) return;
    try {
      await base44.entities.SubcategoriaGasto.update(editingId, {
        nome: editingData.nome.trim(),
        categoria_id: editingData.categoria_id
      });
      handleCancelEditing();
      await loadSubcategorias();
    } catch (error) {
      console.error('Erro ao atualizar tipo:', error);
    }
  };

  const getCategoriaName = (categoriaId) => {
    return categorias.find(c => c.id === categoriaId)?.nome || 'Categoria não encontrada';
  };

  const groupedSubcategorias = categorias.map(categoria => ({
    categoria,
    subcategorias: subcategorias.filter(sub => sub.categoria_id === categoria.id)
  })).filter(group => group.subcategorias.length > 0);

  return (
    <div className="space-y-6">
      {/* Formulário para adicionar novo tipo */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h4 className="font-medium text-slate-800 mb-3">Adicionar Novo Tipo</h4>
        <div className="flex gap-2 flex-wrap">
          <Select 
            value={newSubcategoria.categoria_id} 
            onValueChange={(value) => setNewSubcategoria(prev => ({ ...prev, categoria_id: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Nome do novo tipo"
            value={newSubcategoria.nome}
            onChange={(e) => setNewSubcategoria(prev => ({ ...prev, nome: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-48"
          />
          <Button onClick={handleAdd} disabled={!newSubcategoria.nome.trim() || !newSubcategoria.categoria_id}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Lista de tipos agrupados por categoria */}
      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {groupedSubcategorias.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhum tipo cadastrado. Adicione um tipo acima.
            </p>
          ) : (
            groupedSubcategorias.map(({ categoria, subcategorias: subs }) => (
              <div key={categoria.id} className="border border-slate-200 rounded-lg">
                <div className="bg-slate-100 px-4 py-2 font-medium text-slate-800 rounded-t-lg">
                  {categoria.nome}
                </div>
                <div className="p-2 space-y-2">
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded">
                      {editingId === sub.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select 
                            value={editingData.categoria_id} 
                            onValueChange={(value) => setEditingData(prev => ({ ...prev, categoria_id: value }))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categorias.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
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
                          <span className="flex-1">{sub.nome}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleStartEditing(sub)} aria-label="Editar">
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} aria-label="Excluir">
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