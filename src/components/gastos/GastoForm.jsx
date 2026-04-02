import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Calendar as CalendarIcon, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

import CriacaoRapidaModal from "./CriacaoRapidaModal";
import ParcelasEditor from "./ParcelasEditor";

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  if (typeof dateString === 'string') {
    const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function GastoForm({ gasto, obras, categorias: categoriasInicial, etapasObra: etapasObraInicial, fornecedores: fornecedoresInicial, onSave, onCancel }) {
  const dataRegistro = gasto?.data ? formatDateForInput(gasto.data) : getTodayDate();
  
  const [formData, setFormData] = useState({
    numero_sequencial: gasto?.numero_sequencial || '',
    obra_id: gasto?.obra_id || '',
    descricao: gasto?.descricao || '',
    categoria_id: gasto?.categoria_id || '',
    subcategoria_id: gasto?.subcategoria_id || '',
    etapa_obra_ids: gasto?.etapa_obra_ids || [],
    valor: gasto?.valor || '',
    data: dataRegistro, // This is the record creation date
    data_vencimento: gasto?.data_vencimento ? formatDateForInput(gasto.data_vencimento) : '',
    data_pagamento: gasto?.data_pagamento ? formatDateForInput(gasto.data_pagamento) : '',
    fornecedor_id: gasto?.fornecedor_id || '',
    forma_pagamento: gasto?.forma_pagamento || '',
    status_pagamento: gasto?.status_pagamento || 'pendente',
    observacoes: gasto?.observacoes || '',
    origem_registro: 'web',
    eh_recorrente: gasto?.eh_recorrente || false,
    valor_total_recorrencia: gasto?.valor_total_recorrencia || '',
    valor_entrada: gasto?.valor_entrada || '',
    quantidade_parcelas: gasto?.quantidade_parcelas || ''
  });

  const [categorias, setCategorias] = useState(categoriasInicial);
  const [subcategorias, setSubcategorias] = useState([]);
  const [etapasObra, setEtapasObra] = useState(etapasObraInicial);
  const [fornecedores, setFornecedores] = useState(fornecedoresInicial); // Initialize from prop
  const [diaFixoParcelas, setDiaFixoParcelas] = useState('');
  const [dataInicioParcelas, setDataInicioParcelas] = useState(gasto?.data_vencimento ? formatDateForInput(gasto.data_vencimento) : '');
  const [parcelas, setParcelas] = useState([]);


  // Estados para modais de criação rápida
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalSubcategoria, setModalSubcategoria] = useState(false);
  const [modalEtapa, setModalEtapa] = useState(false);
  // Removed modalFornecedor state

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCategorias(categoriasInicial);
  }, [categoriasInicial]);

  useEffect(() => {
    setEtapasObra(etapasObraInicial);
  }, [etapasObraInicial]);

  useEffect(() => {
    setFornecedores(fornecedoresInicial); // Update local state when prop changes
  }, [fornecedoresInicial]);

  useEffect(() => {
    if (!gasto) {
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
      return;
    }

    const subcategoriaPertenceACategoria = subcategorias.some(
      sub => sub.id === gasto.subcategoria_id && sub.categoria_id === gasto.categoria_id
    );

    setFormData(prev => {
      if (!prev.categoria_id) {
        return { ...prev, subcategoria_id: '' };
      }

      if (prev.subcategoria_id) {
        return prev;
      }

      if (gasto.categoria_id === prev.categoria_id && subcategoriaPertenceACategoria) {
        return { ...prev, subcategoria_id: gasto.subcategoria_id };
      }

      return prev;
    });
  }, [formData.categoria_id, subcategorias, gasto]);

  const loadData = async () => {
    try {
      // EtapasObra and Fornecedores are now passed as props, so no need to fetch them here initially
      const subData = await base44.entities.SubcategoriaGasto.list();
      setSubcategorias(subData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalDataField = formData.data; // Default to the initial data (dataRegistro)
    if (formData.status_pagamento === 'pago' && formData.data_pagamento) {
      finalDataField = formData.data_pagamento;
    } else if (formData.status_pagamento === 'programado' && formData.data_vencimento) {
      finalDataField = formData.data_vencimento;
    }

    const processedData = {
      ...formData,
      numero_sequencial: formData.numero_sequencial,
      valor: formData.valor, 
      data: finalDataField, // Adjusted for 'contabilização' based on payment status
      fornecedor_id: formData.fornecedor_id || null,
      forma_pagamento: formData.forma_pagamento || null,
      data_vencimento: formData.data_vencimento || null,
      data_pagamento: formData.data_pagamento || null,
      observacoes: formData.observacoes || null,
      eh_recorrente: !!formData.eh_recorrente,
      valor_total_recorrencia: formData.eh_recorrente && formData.valor_total_recorrencia ? Number(formData.valor_total_recorrencia) : null,
      valor_entrada: formData.eh_recorrente && formData.valor_entrada !== '' ? Number(formData.valor_entrada) : null,
      quantidade_parcelas: formData.eh_recorrente && formData.quantidade_parcelas ? Number(formData.quantidade_parcelas) : null,
      // arquivo_anexo removed
      subcategoria_id: formData.subcategoria_id || null,
      etapa_obra_ids: formData.etapa_obra_ids.length > 0 ? formData.etapa_obra_ids : null,
      origem_registro: 'web',
      parcelas_recorrencia: formData.eh_recorrente ? parcelas : []
    };

    onSave(processedData);
  };

  const parseMoney = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    return Number(String(value).replace(',', '.')) || 0;
  };

  const valorTotalRecorrenciaNumero = parseMoney(formData.valor_total_recorrencia);
  const valorEntradaNumero = parseMoney(formData.valor_entrada);
  const quantidadeParcelasNumero = Number(formData.quantidade_parcelas || 0);
  const valorParcelaCalculado = quantidadeParcelasNumero > 0
    ? Math.max(valorTotalRecorrenciaNumero - valorEntradaNumero, 0) / quantidadeParcelasNumero
    : 0;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEtapaToggle = (etapaId) => {
    setFormData(prev => {
      const currentEtapas = prev.etapa_obra_ids || [];
      const newEtapas = currentEtapas.includes(etapaId)
        ? currentEtapas.filter(id => id !== etapaId)
        : [...currentEtapas, etapaId];
      return { ...prev, etapa_obra_ids: newEtapas };
    });
  };

  const generateParcelas = () => {
    const quantidade = Number(formData.quantidade_parcelas || 0);
    if (!quantidade) return;

    const baseDate = dataInicioParcelas || getTodayDate();
    const [year, month, day] = baseDate.split('-').map(Number);
    const diaReferencia = Number(diaFixoParcelas || day);

    const valorParcelaCalculado = quantidade > 0
      ? Math.max(parseMoney(formData.valor_total_recorrencia) - parseMoney(formData.valor_entrada), 0) / quantidade
      : 0;

    const novasParcelas = Array.from({ length: quantidade }, (_, index) => {
      const current = new Date(year, month - 1 + index, 1);
      const ultimoDia = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const diaFinal = Math.min(diaReferencia, ultimoDia);
      const data = new Date(current.getFullYear(), current.getMonth(), diaFinal);
      const dataVencimento = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

      return {
        numero_parcela: index + 1,
        valor: valorParcelaCalculado,
        data_vencimento: dataVencimento,
        data_pagamento: '',
        status: 'programado'
      };
    });

    setParcelas(novasParcelas);
  };

  const updateParcela = (numeroParcela, field, value) => {
    setParcelas((prev) => prev.map((item) => item.numero_parcela === numeroParcela ? { ...item, [field]: value } : item));
  };

  // Removed handleFileUpload, handleRemoveFile, getFileName functions

  const handleCategoriaCreated = async (novaCategoria) => {
    const updatedCategorias = await base44.entities.CategoriaGasto.list();
    setCategorias(updatedCategorias);
    setFormData(prev => ({ ...prev, categoria_id: novaCategoria.id }));
  };

  const handleSubcategoriaCreated = async (novaSubcategoria) => {
    const updatedSubcategorias = await base44.entities.SubcategoriaGasto.list();
    setSubcategorias(updatedSubcategorias);
    setFormData(prev => ({ ...prev, subcategoria_id: novaSubcategoria.id }));
  };

  const handleEtapaCreated = async (novaEtapa) => {
    const updatedEtapas = await base44.entities.EtapaObra.list();
    setEtapasObra(updatedEtapas.sort((a, b) => (a.ordem || 999) - (b.ordem || 999)));
    setFormData(prev => ({ 
      ...prev, 
      etapa_obra_ids: [...(prev.etapa_obra_ids || []), novaEtapa.id] 
    }));
  };

  // Removed handleFornecedorCreated

  const subcategoriasDisponiveis = formData.categoria_id
    ? subcategorias.filter(sub => sub.categoria_id === formData.categoria_id)
    : [];
    
  const isStatusProgramado = formData.status_pagamento === 'programado';
  const isStatusPago = formData.status_pagamento === 'pago';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8 bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-800">
                {gasto ? 'Editar Gasto' : 'Novo Gasto'}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
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
              {formData.numero_sequencial && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-700">Número de Rastreamento:</span>
                    <span className="text-lg font-bold text-blue-900">{formData.numero_sequencial}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="categoria_id">Categoria *</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.categoria_id} 
                      onValueChange={(value) => handleChange('categoria_id', value)}
                      required
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setModalCategoria(true)}
                      title="Criar nova categoria"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {formData.categoria_id && subcategoriasDisponiveis.length >= 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategoria_id">Tipo de {categorias.find(c => c.id === formData.categoria_id)?.nome}</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.subcategoria_id || '__none__'} 
                      onValueChange={(value) => handleChange('subcategoria_id', value === '__none__' ? '' : value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o tipo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {subcategoriasDisponiveis.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setModalSubcategoria(true)}
                      disabled={!formData.categoria_id}
                      title="Criar novo tipo"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Etapas da Obra (opcional)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setModalEtapa(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Nova Etapa
                  </Button>
                </div>
                {etapasObra.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
                    {etapasObra.map(etapa => (
                      <div key={etapa.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`etapa-${etapa.id}`}
                          checked={formData.etapa_obra_ids?.includes(etapa.id)}
                          onCheckedChange={() => handleEtapaToggle(etapa.id)}
                        />
                        <label
                          htmlFor={`etapa-${etapa.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {etapa.nome}
                          {etapa.descricao && (
                            <span className="text-slate-500 font-normal ml-2">- {etapa.descricao}</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma etapa cadastrada. Clique em "Nova Etapa" para criar.</p>
                )}
                {formData.etapa_obra_ids?.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {formData.etapa_obra_ids.length} etapa(s) selecionada(s)
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor da parcela *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => handleChange('valor', e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">Use ponto (.) como separador decimal. Ex: 525.41</p>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <Checkbox
                    id="eh_recorrente"
                    checked={!!formData.eh_recorrente}
                    onCheckedChange={(checked) => handleChange('eh_recorrente', !!checked)}
                  />
                  <Label htmlFor="eh_recorrente" className="cursor-pointer">Este gasto é recorrente / parcelado</Label>
                </div>

                {formData.eh_recorrente && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor_total_recorrencia">Valor total</Label>
                        <Input
                          id="valor_total_recorrencia"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_total_recorrencia}
                          onChange={(e) => handleChange('valor_total_recorrencia', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor_entrada">Entrada</Label>
                        <Input
                          id="valor_entrada"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_entrada}
                          onChange={(e) => handleChange('valor_entrada', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantidade_parcelas">Parcelas</Label>
                        <Input
                          id="quantidade_parcelas"
                          type="number"
                          min="1"
                          value={formData.quantidade_parcelas}
                          onChange={(e) => handleChange('quantidade_parcelas', e.target.value)}
                          placeholder="Ex: 10"
                        />
                      </div>
                    </div>
                    <ParcelasEditor
                      parcelas={parcelas}
                      quantidadeParcelas={formData.quantidade_parcelas}
                      onChangeQuantidade={(value) => handleChange('quantidade_parcelas', value)}
                      onGenerate={generateParcelas}
                      onUpdateParcela={updateParcela}
                      diaFixo={diaFixoParcelas}
                      onChangeDiaFixo={setDiaFixoParcelas}
                      dataInicio={dataInicioParcelas}
                      onChangeDataInicio={setDataInicioParcelas}
                      valorParcela={valorParcelaCalculado}
                      valorTotal={formData.valor_total_recorrencia}
                      valorEntrada={formData.valor_entrada}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_pagamento">Status do Pagamento</Label>
                <Select value={formData.status_pagamento} onValueChange={(value) => handleChange('status_pagamento', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isStatusProgramado && (
                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => handleChange('data_vencimento', e.target.value)}
                    required={isStatusProgramado}
                  />
                </div>
              )}

              {isStatusPago && (
                <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-200">
                  <Label htmlFor="data_pagamento">Data de Pagamento *</Label>
                  <Input
                    id="data_pagamento"
                    type="date"
                    value={formData.data_pagamento}
                    onChange={(e) => handleChange('data_pagamento', e.target.value)}
                    required={isStatusPago}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor_id">Fornecedor</Label>
                  <Select 
                    value={formData.fornecedor_id || '__none__'} 
                    onValueChange={(value) => handleChange('fornecedor_id', value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {fornecedores.map(fornecedor => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
              </div>

              {/* Removed "Anexar Arquivo" section */}

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

      {/* Modais de Criação Rápida */}
      <CriacaoRapidaModal
        tipo="categoria"
        open={modalCategoria}
        onOpenChange={setModalCategoria}
        onSuccess={handleCategoriaCreated}
      />

      <CriacaoRapidaModal
        tipo="subcategoria"
        open={modalSubcategoria}
        onOpenChange={setModalSubcategoria}
        onSuccess={handleSubcategoriaCreated}
        categoriaId={formData.categoria_id}
      />

      <CriacaoRapidaModal
        tipo="etapa"
        open={modalEtapa}
        onOpenChange={setModalEtapa}
        onSuccess={handleEtapaCreated}
      />

      {/* Removed CriacaoRapidaModal for Fornecedor */}
    </>
  );
}