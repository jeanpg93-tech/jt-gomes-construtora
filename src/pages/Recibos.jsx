
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, User, Plus } from "lucide-react"; // Added Plus icon import


export default function Recibos() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed showFornecedorForm state as the form is no longer rendered here
  const [dadosImpressao, setDadosImpressao] = useState(null);
  // Added showReciboForm state to control the visibility of the form
  const [showReciboForm, setShowReciboForm] = useState(true); // Initialize to true to show the form by default

  // Dados fixos da construtora
  const dadosConstrutora = {
    razao_social: "GOMES E RIBEIRO EMPREENDIMENTOS IMOBILIÁRIOS LTDA",
    cnpj: "48.624.524/0001-80",
    endereco: "Avenida Presidente Castelo Branco, nº 1800, Bloco A1, Apto 360 – Bairro Boqueirão, CEP 11700-015 – Praia Grande/SP",
    representante: "Francisco de Assis Lima Gomes",
    nacionalidade: "brasileiro",
    estado_civil: "casado",
    profissao: "empresário",
    rg: "16.586.672 SSP/SP",
    cpf: "065.441.068-28"
  };

  // Estado do formulário de recibo
  const [reciboData, setReciboData] = useState({
    fornecedor_id: '',
    valor: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: '',
    referencia_pagamento: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fornecedoresData = await base44.entities.Fornecedor.list('-created_date');
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleFornecedorSaved as the form is no longer rendered here

  const handleGerarRecibo = async () => {
    // Validação
    if (!reciboData.fornecedor_id || !reciboData.valor || !reciboData.forma_pagamento || !reciboData.referencia_pagamento) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Preparar dados para impressão
    const fornecedor = fornecedores.find(p => p.id === reciboData.fornecedor_id);
    
    if (!fornecedor) {
      alert('Fornecedor não encontrado');
      return;
    }

    const dados = {
      construtora: dadosConstrutora,
      contratado: fornecedor,
      valor: parseFloat(reciboData.valor),
      data_pagamento: reciboData.data_pagamento,
      forma_pagamento: reciboData.forma_pagamento,
      referencia_pagamento: reciboData.referencia_pagamento
    };

    // Salvar recibo no banco de dados
    try {
      await base44.entities.Recibo.create({
        fornecedor_id: reciboData.fornecedor_id,
        valor: parseFloat(reciboData.valor),
        data_pagamento: reciboData.data_pagamento,
        forma_pagamento: reciboData.forma_pagamento,
        referencia_pagamento: reciboData.referencia_pagamento,
        data_emissao: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
      alert('Erro ao salvar recibo. O recibo será impresso, mas não foi salvo no sistema.');
    }

    // Definir dados para impressão
    setDadosImpressao(dados);
    
    // Aguardar renderização e então imprimir
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const valorPorExtenso = (valor) => {
    // Função básica de conversão de número para extenso
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const converterGrupo = (num) => {
      if (num === 0) return '';
      if (num === 100) return 'cem';
      
      const c = Math.floor(num / 100);
      const d = Math.floor((num % 100) / 10);
      const u = num % 10;
      
      let resultado = '';
      
      if (c > 0) resultado += centenas[c];
      if (d > 0 || u > 0) {
        if (resultado) resultado += ' e ';
        if (d === 1) {
          resultado += especiais[u];
        } else {
          if (d > 0) resultado += dezenas[d];
          if (u > 0) {
            if (d > 0) resultado += ' e ';
            resultado += unidades[u];
          }
        }
      }
      
      return resultado;
    };

    const partes = valor.toFixed(2).split('.');
    const reais = parseInt(partes[0]);
    const centavos = parseInt(partes[1]);

    let extenso = '';

    if (reais === 0) {
      extenso = 'zero reais';
    } else if (reais === 1) {
      extenso = 'um real';
    } else if (reais < 1000) {
      extenso = converterGrupo(reais) + ' reais';
    } else if (reais < 1000000) {
      const milhares = Math.floor(reais / 1000);
      const resto = reais % 1000;
      
      if (milhares === 1) {
        extenso = 'mil';
      } else {
        extenso = converterGrupo(milhares) + ' mil';
      }
      
      if (resto > 0) {
        extenso += ' e ' + converterGrupo(resto);
      }
      extenso += ' reais';
    } else {
      // Para valores muito altos, usar formatação simples
      extenso = `${formatCurrency(reais)} reais`;
    }

    if (centavos > 0) {
      if (centavos === 1) {
        extenso += ' e um centavo';
      } else {
        extenso += ' e ' + converterGrupo(centavos) + ' centavos';
      }
    }

    return extenso;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            background: white !important;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .print-show {
            display: block !important;
            background: white !important;
          }
          
          .recibo-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white !important;
          }
          
          .recibo-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }
          
          .recibo-header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .recibo-body {
            margin: 40px 0;
            text-align: justify;
            line-height: 2;
          }
          
          .recibo-body p {
            margin: 20px 0;
            text-indent: 50px;
          }
          
          .recibo-valor {
            font-weight: bold;
            text-decoration: underline;
          }
          
          .recibo-data {
            margin-top: 60px;
            text-align: right;
            font-size: 12px;
          }
          
          .recibo-assinaturas {
            margin-top: 80px;
            page-break-inside: avoid;
          }
          
          .recibo-assinatura-item {
            margin: 40px 0;
            text-align: center;
          }
          
          .recibo-assinatura-linha {
            width: 300px;
            margin: 0 auto;
            border-top: 1px solid #000;
            padding-top: 8px;
          }
          
          .recibo-assinatura-nome {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .recibo-assinatura-doc {
            font-size: 11px;
            color: #333;
          }
        }
      `}</style>

      {/* Versão para tela */}
      <div className="print-hide">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Recibos {/* Changed title here */}
            </h1>
            <p className="text-slate-600">Gere e gerencie recibos de pagamento</p> {/* Changed description here */}
          </div>
          {/* Added Novo Recibo button */}
          <Button
            onClick={() => setShowReciboForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Recibo
          </Button>
        </div>

        {/* Conditionally render the form card based on showReciboForm state */}
        {showReciboForm && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Novo Recibo de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Contratado/Beneficiário *</Label>
                <Select value={reciboData.fornecedor_id} onValueChange={(value) => setReciboData({...reciboData, fornecedor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome} - {fornecedor.cpf_cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fornecedores.length === 0 && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Nenhum fornecedor cadastrado. Cadastre fornecedores primeiro.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Pago *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={reciboData.valor}
                      onChange={(e) => setReciboData({...reciboData, valor: e.target.value})}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
                  <Input
                    id="data_pagamento"
                    type="date"
                    value={reciboData.data_pagamento}
                    onChange={(e) => setReciboData({...reciboData, data_pagamento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select value={reciboData.forma_pagamento} onValueChange={(value) => setReciboData({...reciboData, forma_pagamento: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espécie">Espécie (Dinheiro)</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="transferência bancária">Transferência Bancária</SelectItem>
                    <SelectItem value="depósito bancário">Depósito Bancário</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cartão de crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartão de débito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto bancário">Boleto Bancário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencia_pagamento">Referência do Pagamento *</Label>
                <Textarea
                  id="referencia_pagamento"
                  value={reciboData.referencia_pagamento}
                  onChange={(e) => setReciboData({...reciboData, referencia_pagamento: e.target.value})}
                  placeholder="Ex: Contrato nº 2025/001, Quinzena de janeiro/2025, Serviços de pintura, etc."
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Descreva o motivo do pagamento (número do contrato, período, tipo de serviço, etc.)
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleGerarRecibo} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Download className="w-4 h-4 mr-2" />
                  Gerar e Imprimir Recibo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {fornecedores.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 mb-2">Nenhum fornecedor cadastrado</h3>
              <p className="text-sm text-slate-500">Cadastre fornecedores na página "Fornecedores" para emitir recibos</p>
              {/* Removed Cadastrar Primeiro Fornecedor Button */}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Versão para impressão */}
      {dadosImpressao && (
        <div className="print-show hidden">
          <div className="recibo-container">
            <div className="recibo-header">
              <h1>Recibo de Pagamento</h1>
            </div>

            <div className="recibo-body">
              <p>
                Pelo presente recibo, a empresa <strong>{dadosImpressao.construtora.razao_social}</strong>, inscrita no CNPJ sob o nº <strong>{dadosImpressao.construtora.cnpj}</strong>, com sede em {dadosImpressao.construtora.endereco}, neste ato representada por seu Sócio Administrador <strong>{dadosImpressao.construtora.representante}</strong>, declara ter efetuado o pagamento da quantia de <span className="recibo-valor">R$ {formatCurrency(dadosImpressao.valor)} ({valorPorExtenso(dadosImpressao.valor)})</span>.
              </p>
              <p>
                O pagamento foi realizado a <strong>{dadosImpressao.contratado.nome}</strong>, {dadosImpressao.contratado.tipo === 'juridica' ? 'CNPJ' : 'CPF'} nº <strong>{dadosImpressao.contratado.cpf_cnpj}</strong>, em <strong>{(() => {
                  const [year, month, day] = dadosImpressao.data_pagamento.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                })()}</strong>, por meio de <strong>{dadosImpressao.forma_pagamento}</strong>, referente a/ao <strong>{dadosImpressao.referencia_pagamento}</strong>.
              </p>
              <p>
                Este documento é emitido como prova de quitação do valor supracitado, para que produza seus devidos efeitos legais.
              </p>
            </div>

            <div className="recibo-data">
              <p>Praia Grande/SP, {(() => {
                const [year, month, day] = dadosImpressao.data_pagamento.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
              })()}</p>
            </div>

            <div className="recibo-assinaturas">
              <div className="recibo-assinatura-item">
                <div className="recibo-assinatura-linha">
                  <p className="recibo-assinatura-nome">{dadosImpressao.contratado.nome}</p>
                  <p className="recibo-assinatura-doc">
                    {dadosImpressao.contratado.tipo === 'juridica' ? 'CNPJ' : 'CPF'}: {dadosImpressao.contratado.cpf_cnpj}
                  </p>
                </div>
              </div>

              <div className="recibo-assinatura-item">
                <div className="recibo-assinatura-linha">
                  <p className="recibo-assinatura-nome">{dadosImpressao.construtora.razao_social}</p>
                  <p className="recibo-assinatura-doc">CNPJ: {dadosImpressao.construtora.cnpj}</p>
                  <p className="recibo-assinatura-doc">Representada por: {dadosImpressao.construtora.representante}</p>
                  <p className="recibo-assinatura-doc">CPF: {dadosImpressao.construtora.cpf}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed FornecedorForm rendering */}
    </div>
  );
}
