import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function GerenciadorFornecedor() {
  const [fornecedores, setFornecedores] = useState([]);
  const [newFornecedor, setNewFornecedor] = useState({ nome: '', contato: '', observacoes: '' });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ nome: '', contato: '', observacoes: '' });

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Fornecedor.list();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newFornecedor.nome.trim()) return;
    try {
      await base44.entities.Fornecedor.create({
        nome: newFornecedor.nome.trim(),
        contato: newFornecedor.contato.trim() || null,
        observacoes: newFornecedor.observacoes.trim() || null
      });
      setNewFornecedor({ nome: '', contato: '', observacoes: '' });
      await loadFornecedores();
    } catch (error) {
      console.error('Erro ao adicionar fornecedor:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    try {
      await base44.entities.Fornecedor.delete(id);
      await loadFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
    }
  };
  
  const handleStartEdit = (fornecedor) => {
    setEditingId(fornecedor.id);
    setEditingData({
      nome: fornecedor.nome,
      contato: fornecedor.contato || '',
      observacoes: fornecedor.observacoes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({ nome: '', contato: '', observacoes: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingData.nome.trim() || !editingId) return;
    try {
      await base44.entities.Fornecedor.update(editingId, {
        nome: editingData.nome.trim(),
        contato: editingData.contato.trim() || null,
        observacoes: editingData.observacoes.trim() || null
      });
      handleCancelEdit();
      await loadFornecedores();
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Adição */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <h3 className="font-semibold text-slate-800">Adicionar Novo Fornecedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="new-nome">Nome *</Label>
            <Input
              id="new-nome"
              placeholder="Nome do fornecedor"
              value={newFornecedor.nome}
              onChange={(e) => setNewFornecedor({...newFornecedor, nome: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <Label htmlFor="new-contato">Contato</Label>
            <Input
              id="new-contato"
              placeholder="Telefone ou email"
              value={newFornecedor.contato}
              onChange={(e) => setNewFornecedor({...newFornecedor, contato: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="new-obs">Observações</Label>
            <Input
              id="new-obs"
              placeholder="Notas adicionais"
              value={newFornecedor.observacoes}
              onChange={(e) => setNewFornecedor({...newFornecedor, observacoes: e.target.value})}
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={!newFornecedor.nome.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Lista de Fornecedores */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-2">
          {fornecedores.map((fornecedor) => (
            <div key={fornecedor.id} className="bg-slate-50 rounded-md border border-slate-200">
              {editingId === fornecedor.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Nome *</Label>
                      <Input 
                        value={editingData.nome} 
                        onChange={(e) => setEditingData({...editingData, nome: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      />
                    </div>
                    <div>
                      <Label>Contato</Label>
                      <Input 
                        value={editingData.contato} 
                        onChange={(e) => setEditingData({...editingData, contato: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Input 
                        value={editingData.observacoes} 
                        onChange={(e) => setEditingData({...editingData, observacoes: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSaveEdit} disabled={!editingData.nome.trim()}>
                      <Save className="w-4 h-4 mr-1 text-green-500" />
                      Salvar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1 text-gray-500" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{fornecedor.nome}</p>
                    <div className="flex gap-4 text-sm text-slate-600 mt-1">
                      {fornecedor.contato && <span>📞 {fornecedor.contato}</span>}
                      {fornecedor.observacoes && <span>📝 {fornecedor.observacoes}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(fornecedor)}>
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(fornecedor.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {fornecedores.length === 0 && (
            <p className="text-center text-slate-500 py-8">Nenhum fornecedor cadastrado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}