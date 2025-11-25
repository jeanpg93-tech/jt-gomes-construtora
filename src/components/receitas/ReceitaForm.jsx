import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Calendar } from "lucide-react";
import { format } from "date-fns"; // This import is still needed for other date formatting if any, but not for the specific change.
import { ptBR } from "date-fns/locale"; // This import is still needed for other date formatting if any, but not for the specific change.

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para obter a data de hoje no formato YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para formatar data para exibição sem problemas de timezone (de YYYY-MM-DD para DD/MM/YYYY)
const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  // Assuming dateString is already in 'YYYY-MM-DD' format
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function ReceitaForm({ receita, obras, categorias, onSave, onCancel }) {
  // Se está editando, usa a data original; se é novo, usa hoje
  const dataRegistro = receita?.data ? formatDateForInput(receita.data) : getTodayDate();
  
  const [formData, setFormData] = useState({
    obra_id: receita?.obra_id || '',
    descricao: receita?.descricao || '',
    categoria_id: receita?.categoria_id || '',
    tipo: receita?.tipo || '',
    valor: receita?.valor || '',
    data: dataRegistro,
    data_vencimento: receita?.data_vencimento ? formatDateForInput(receita.data_vencimento) : '',
    cliente: receita?.cliente || '',
    forma_pagamento: receita?.forma_pagamento || '',
    status: receita?.status || 'prevista',
    observacoes: receita?.observacoes || '',
    origem_registro: 'web' // Adicionando o campo de origem do registro
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // The addOneDay function and its usage are removed as per the change request.
    // The dates are now passed directly as they are already in 'YYYY-MM-DD' format from the input.
    
    const processedData = {
      ...formData,
      valor: parseFloat(formData.valor),
      data: formData.data, // No longer adding 1 day
      data_vencimento: formData.data_vencimento || null, // No longer adding 1 day
      cliente: formData.cliente || null,
      forma_pagamento: formData.forma_pagamento || null,
      observacoes: formData.observacoes || null,
      origem_registro: 'web' // Garantindo que a origem seja 'web' no momento do salvamento
    };

    onSave(processedData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">
              {receita ? 'Editar Receita' : 'Nova Receita'}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Registro: {formatDateDisplay(dataRegistro)}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="obra_id">Obra *</Label>
              <Select 
                value={formData.obra_id} 
                onValueChange={(value) => handleChange('obra_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.filter(o => o.ativa !== false).map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria_id">Categoria</Label>
                <Select 
                  value={formData.categoria_id} 
                  onValueChange={(value) => handleChange('categoria_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => handleChange('tipo', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="sinal">Sinal</SelectItem>
                    <SelectItem value="parcela">Parcela</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Descrição da receita"
                required
              />
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
              <p className="text-xs text-slate-500">Use ponto (.) como separador decimal. Ex: 5000.50</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => handleChange('data_vencimento', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleChange('cliente', e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento || '__none__'} onValueChange={(value) => handleChange('forma_pagamento', value === '__none__' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prevista">Prevista</SelectItem>
                    <SelectItem value="recebida">Recebida</SelectItem>
                    <SelectItem value="atrasada">Atrasada</SelectItem>
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
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
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