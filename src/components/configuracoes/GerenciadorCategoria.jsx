import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

export default function GerenciadorCategoria() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CategoriaGasto.list();
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await base44.entities.CategoriaGasto.create({ nome: newItemName.trim() });
      setNewItemName('');
      await loadItems();
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await base44.entities.CategoriaGasto.delete(id);
      await loadItems();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
    }
  };
  
  const handleStartEditing = (item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.nome);
  };

  const handleCancelEditing = () => {
    setEditingItemId(null);
    setEditingItemName('');
  };

  const handleSaveEditing = async () => {
    if (!editingItemName.trim() || !editingItemId) return;
    try {
      await base44.entities.CategoriaGasto.update(editingItemId, { nome: editingItemName.trim() });
      handleCancelEditing();
      await loadItems();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova categoria"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
        />
        <Button onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma categoria cadastrada</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                {editingItemId === item.id ? (
                  <>
                    <Input 
                      value={editingItemName} 
                      onChange={(e) => setEditingItemName(e.target.value)}
                      className="flex-1 mr-2"
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
                  </>
                ) : (
                  <>
                    <span className="flex-1">{item.nome}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleStartEditing(item)} aria-label="Editar">
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} aria-label="Excluir">
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