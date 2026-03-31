import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  if (typeof dateString === 'string' && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function GastoAdministrativoForm({ gasto, onSave, onCancel }) {
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    descricao: gasto?.descricao || '',
    categoria_id: gasto?.categoria_id || '',
    valor: gasto?.valor || '',
    data: gasto?.data ? formatDateForInput(gasto.data) : getTodayDate(),
    fornecedor_id: gasto?.fornecedor_id || '',
    forma_pagamento: gasto?.forma_pagamento || '',
    status_pagamento: gasto?.status_pagamento || 'pendente',
    observacoes: gasto?.observacoes || ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriasData, fornecedoresData] = await Promise.all([
        base44.entities.CategoriaGastoAdministrativo.list(),
        base44.entities.Fornecedor.list()
      ]);
      setCategorias(categoriasData);
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Função para converter valor corretamente
    const parseValor = (valor) => {
      if (valor === null || valor === undefined || valor === '') return 0;
      
      if (typeof valor === 'number' && !isNaN(valor)) {
        return parseFloat(valor.toFixed(2));
      }
      
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
      descricao: formData.descricao,
      categoria_id: formData.categoria_id,
      valor: parseValor(formData.valor),
      data: formData.data, // IMPORTANTE: Não adicionar 1 dia, enviar exatamente como está
      fornecedor_id: formData.fornecedor_id || null,
      forma_pagamento: formData.forma_pagamento || null,
      status_pagamento: formData.status_pagamento,
      observacoes: formData.observacoes || null
    };

    onSave(processedData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8 bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">
              {gasto ? 'Editar Gasto Administrativo' : 'Novo Gasto Administrativo'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Descrição do gasto"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria_id">Categoria *</Label>
                {loading ? (
                  <div className="text-sm text-slate-500">Carregando categorias...</div>
                ) : categorias.length === 0 ? (
                  <div className="text-sm text-amber-600">
                    ⚠️ Nenhuma categoria cadastrada. Crie categorias em Configurações primeiro.
                  </div>
                ) : (
                  <Select value={formData.categoria_id} onValueChange={(value) => handleChange('categoria_id', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => handleChange('valor', e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleChange('data', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_pagamento">Status do Pagamento</Label>
                <Select value={formData.status_pagamento} onValueChange={(value) => handleChange('status_pagamento', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fornecedor_id">Fornecedor</Label>
                <Select value={formData.fornecedor_id || '__none__'} onValueChange={(value) => handleChange('fornecedor_id', value === '__none__' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                        {fornecedor.contato && <span className="text-slate-500 text-xs ml-2">({fornecedor.contato})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento || '__none__'} onValueChange={(value) => handleChange('forma_pagamento', value === '__none__' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading || categorias.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}