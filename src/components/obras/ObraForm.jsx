import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Calculator, Upload, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ObraForm({ obra, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nome: obra?.nome || '',
    endereco: obra?.endereco || '',
    foto_url: obra?.foto_url || '',
    area_construida: obra?.area_construida || '',
    area_terreno: obra?.area_terreno || '',
    data_inicio: obra?.data_inicio || '',
    data_previsao_entrega: obra?.data_previsao_entrega || '',
    status: obra?.status || 'planejamento',
    valor_terreno: obra?.valor_terreno || '',
    valor_mao_obra_m2: obra?.valor_mao_obra_m2 || '',
    previsao_gastos_materiais: obra?.previsao_gastos_materiais || '',
    valor_venda_projetado: obra?.valor_venda_projetado || '',
    imposto_percentual: obra?.imposto_percentual || '',
    comissao_percentual: obra?.comissao_percentual || '',
    valor_venda_real: obra?.valor_venda_real || '',
    observacoes: obra?.observacoes || '',
    ativa: obra?.ativa !== undefined ? obra.ativa : true
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Cálculos automáticos
  const calcularValorTotalMaoObra = () => {
    const areaConst = parseFloat(formData.area_construida) || 0;
    const valorM2 = parseFloat(formData.valor_mao_obra_m2) || 0;
    return areaConst * valorM2;
  };

  const calcularValorTotalGastosProjetado = () => {
    const terreno = parseFloat(formData.valor_terreno) || 0;
    const materiais = parseFloat(formData.previsao_gastos_materiais) || 0;
    const maoObra = calcularValorTotalMaoObra();
    return terreno + materiais + maoObra;
  };

  const calcularValorVendaReal = () => {
    const vendaBruto = parseFloat(formData.valor_venda_projetado) || 0;
    const imposto = parseFloat(formData.imposto_percentual) || 0;
    const comissao = parseFloat(formData.comissao_percentual) || 0;
    
    const descontoImposto = vendaBruto * (imposto / 100);
    const descontoComissao = vendaBruto * (comissao / 100);
    
    return vendaBruto - descontoImposto - descontoComissao;
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      area_construida: formData.area_construida ? parseFloat(formData.area_construida) : null,
      area_terreno: formData.area_terreno ? parseFloat(formData.area_terreno) : null,
      valor_terreno: formData.valor_terreno ? parseFloat(formData.valor_terreno) : null,
      valor_mao_obra_m2: formData.valor_mao_obra_m2 ? parseFloat(formData.valor_mao_obra_m2) : null,
      previsao_gastos_materiais: formData.previsao_gastos_materiais ? parseFloat(formData.previsao_gastos_materiais) : null,
      valor_venda_projetado: formData.valor_venda_projetado ? parseFloat(formData.valor_venda_projetado) : null,
      imposto_percentual: formData.imposto_percentual ? parseFloat(formData.imposto_percentual) : null,
      comissao_percentual: formData.comissao_percentual ? parseFloat(formData.comissao_percentual) : null,
      valor_venda_real: formData.valor_venda_real ? parseFloat(formData.valor_venda_real) : null,
      data_inicio: formData.data_inicio || null,
      data_previsao_entrega: formData.data_previsao_entrega || null,
      ativa: formData.ativa
    };

    onSave(processedData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    setUploadingFoto(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, foto_url: result.file_url }));
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoverFoto = () => {
    setFormData(prev => ({ ...prev, foto_url: '' }));
  };

  const valorTotalMaoObra = calcularValorTotalMaoObra();
  const valorTotalGastosProjetado = calcularValorTotalGastosProjetado();
  const valorVendaReal = calcularValorVendaReal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">
              {obra ? 'Editar Obra' : 'Nova Obra'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                📋 Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Obra *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Nome da obra"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejamento">Planejamento</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="vendida">Vendida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Toggle Ativa/Inativa */}
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${formData.ativa ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center gap-3">
                  {formData.ativa ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <Label className={`font-semibold ${formData.ativa ? 'text-green-700' : 'text-red-700'}`}>
                      {formData.ativa ? 'Obra Ativa' : 'Obra Inativa'}
                    </Label>
                    <p className="text-xs text-slate-500">
                      {formData.ativa 
                        ? 'Esta obra aparece nos filtros e relatórios' 
                        : 'Esta obra está oculta nos filtros e relatórios'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.ativa}
                  onCheckedChange={(checked) => handleChange('ativa', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  placeholder="Endereço completo da obra"
                  required
                />
              </div>

              {/* Upload de Foto */}
              <div className="space-y-4">
                <Label>Foto de Referência</Label>
                
                {formData.foto_url && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
                    <img 
                      src={formData.foto_url} 
                      alt="Foto da obra" 
                      className="w-24 h-24 rounded-lg object-cover shadow-md"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">Foto atual</p>
                      <p className="text-xs text-slate-500">Esta foto será exibida como miniatura</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoverFoto}
                      className="text-red-600 hover:text-red-700"
                      disabled={uploadingFoto}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-2">
                    {formData.foto_url ? 'Clique para alterar a foto' : 'Clique para adicionar uma foto'}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Formatos aceitos: PNG, JPG, JPEG (max. 5MB)
                  </p>
                  <input
                    type="file"
                    id="foto-upload"
                    onChange={handleFotoUpload}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    disabled={uploadingFoto}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('foto-upload').click()}
                    disabled={uploadingFoto}
                  >
                    {uploadingFoto ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.foto_url ? 'Alterar Foto' : 'Selecionar Foto'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_construida">Área Construída (m²)</Label>
                  <Input
                    id="area_construida"
                    type="number"
                    step="0.01"
                    value={formData.area_construida}
                    onChange={(e) => handleChange('area_construida', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="area_terreno">Área do Terreno (m²)</Label>
                  <Input
                    id="area_terreno"
                    type="number"
                    step="0.01"
                    value={formData.area_terreno}
                    onChange={(e) => handleChange('area_terreno', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleChange('data_inicio', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_previsao_entrega">Previsão de Entrega</Label>
                  <Input
                    id="data_previsao_entrega"
                    type="date"
                    value={formData.data_previsao_entrega}
                    onChange={(e) => handleChange('data_previsao_entrega', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Composição de Custos */}
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                💰 Composição Detalhada de Custos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_terreno">Valor do Terreno</Label>
                  <Input
                    id="valor_terreno"
                    type="number"
                    step="0.01"
                    value={formData.valor_terreno}
                    onChange={(e) => handleChange('valor_terreno', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previsao_gastos_materiais">Previsão Gastos Materiais</Label>
                  <Input
                    id="previsao_gastos_materiais"
                    type="number"
                    step="0.01"
                    value={formData.previsao_gastos_materiais}
                    onChange={(e) => handleChange('previsao_gastos_materiais', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_mao_obra_m2">Valor Mão de Obra/m²</Label>
                  <Input
                    id="valor_mao_obra_m2"
                    type="number"
                    step="0.01"
                    value={formData.valor_mao_obra_m2}
                    onChange={(e) => handleChange('valor_mao_obra_m2', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Custo de mão de obra por metro quadrado</p>
                </div>
                
                <div className="space-y-2 bg-white p-3 rounded border border-amber-300">
                  <Label className="text-amber-700">Valor Total Mão de Obra (Calculado)</Label>
                  <p className="text-xl font-bold text-amber-900">{formatCurrency(valorTotalMaoObra)}</p>
                  <p className="text-xs text-slate-500">
                    {formData.area_construida && formData.valor_mao_obra_m2 
                      ? `${formData.area_construida}m² × R$ ${parseFloat(formData.valor_mao_obra_m2).toFixed(2)}/m²`
                      : 'Preencha área e valor/m²'}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-lg border-2 border-amber-400">
                <Label className="text-amber-800 font-semibold">💎 Valor Total de Gastos Projetado (Calculado)</Label>
                <p className="text-2xl font-bold text-amber-900 mt-2">{formatCurrency(valorTotalGastosProjetado)}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Terreno + Materiais + Mão de Obra Total
                </p>
              </div>
            </div>

            {/* Valores de Venda */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                💵 Valores de Venda
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_venda_projetado">Valor Venda Projetado (Bruto)</Label>
                  <Input
                    id="valor_venda_projetado"
                    type="number"
                    step="0.01"
                    value={formData.valor_venda_projetado}
                    onChange={(e) => handleChange('valor_venda_projetado', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_venda_real">Valor Venda Real (Manual)</Label>
                  <Input
                    id="valor_venda_real"
                    type="number"
                    step="0.01"
                    value={formData.valor_venda_real}
                    onChange={(e) => handleChange('valor_venda_real', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Valor real de venda (se diferente do calculado)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imposto_percentual">Imposto (%)</Label>
                  <Input
                    id="imposto_percentual"
                    type="number"
                    step="0.01"
                    value={formData.imposto_percentual}
                    onChange={(e) => handleChange('imposto_percentual', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Ex: 5 para 5%</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comissao_percentual">Comissão (%)</Label>
                  <Input
                    id="comissao_percentual"
                    type="number"
                    step="0.01"
                    value={formData.comissao_percentual}
                    onChange={(e) => handleChange('comissao_percentual', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">Ex: 3 para 3%</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-green-400">
                <Label className="text-green-800 font-semibold">💰 Valor Venda Real (Calculado)</Label>
                <p className="text-2xl font-bold text-green-900 mt-2">{formatCurrency(valorVendaReal)}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Valor Bruto - Impostos ({formData.imposto_percentual || 0}%) - Comissão ({formData.comissao_percentual || 0}%)
                </p>
                {formData.valor_venda_projetado && (formData.imposto_percentual || formData.comissao_percentual) && (
                  <p className="text-xs text-slate-600 mt-2">
                    Descontos: {formatCurrency(parseFloat(formData.valor_venda_projetado) - valorVendaReal)}
                  </p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Observações adicionais sobre a obra"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-200 pb-2 mt-6">
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