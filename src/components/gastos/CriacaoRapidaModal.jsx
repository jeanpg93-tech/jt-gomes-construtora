import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";

export default function CriacaoRapidaModal({ tipo, open, onOpenChange, onSuccess, categoriaId }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState('');
  const [contato, setContato] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let novoItem;
      
      switch (tipo) {
        case 'categoria':
          novoItem = await base44.entities.CategoriaGasto.create({ nome });
          break;
        case 'subcategoria':
          if (!categoriaId) {
            alert('Selecione uma categoria primeiro');
            return;
          }
          novoItem = await base44.entities.SubcategoriaGasto.create({ nome, categoria_id: categoriaId });
          break;
        case 'etapa':
          novoItem = await base44.entities.EtapaObra.create({ 
            nome, 
            descricao: descricao || null,
            ordem: ordem ? parseInt(ordem) : null 
          });
          break;
        case 'fornecedor':
          novoItem = await base44.entities.Fornecedor.create({ 
            tipo: 'fisica',
            nome, 
            telefone: contato || null,
            observacoes: observacoes || null
          });
          break;
        default:
          throw new Error('Tipo inválido');
      }

      onSuccess(novoItem);
      onOpenChange(false);
      // Limpar campos
      setNome('');
      setDescricao('');
      setOrdem('');
      setContato('');
      setObservacoes('');
    } catch (error) {
      console.error('Erro ao criar item:', error);
      alert('Erro ao criar item. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'categoria': return 'Nova Categoria';
      case 'subcategoria': return 'Novo Tipo';
      case 'etapa': return 'Nova Etapa da Obra';
      case 'fornecedor': return 'Novo Fornecedor';
      default: return 'Novo Item';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">
              {getTitulo()}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={`Nome ${tipo === 'categoria' ? 'da categoria' : tipo === 'subcategoria' ? 'do tipo' : tipo === 'etapa' ? 'da etapa' : 'do fornecedor'}`}
                required
                autoFocus
              />
            </div>

            {tipo === 'etapa' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição da etapa (opcional)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value)}
                    placeholder="Ordem sequencial (opcional)"
                  />
                </div>
              </>
            )}

            {tipo === 'fornecedor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contato">Telefone/Email</Label>
                  <Input
                    id="contato"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="Telefone ou email (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais (opcional)"
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}