
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Download, Plus, X, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import FornecedorForm from "../components/fornecedor/FornecedorForm";

export default function Contratos() {
  const [fornecedores, setFornecedores] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFornecedorForm, setShowFornecedorForm] = useState(false);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [dadosImpressao, setDadosImpressao] = useState(null);
  const [dadosConstrutora, setDadosConstrutora] = useState(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [contratoData, setContratoData] = useState({
    tipo_contrato: 'construcao_civil',
    tipo_contrato_outro: '',
    descricao_servicos: '',
    obra_id: '',
    obra_nome: '',
    obra_endereco: '',
    area_total: '',
    valor_total: '',
    valor_m2: '',
    forma_pagamento: '',
    data_inicio: '',
    prazo_quantidade: '',
    prazo_unidade: 'meses',
    data_termino: '',
    contratados: []
  });

  const [novoContratado, setNovoContratado] = useState({
    fornecedor_id: ''
  });

  useEffect(() => {
    loadData();
    loadDadosConstrutora();
  }, []);

  const loadData = async () => {
    try {
      const [fornecedoresData, obrasData, contratosData] = await Promise.all([
        base44.entities.Fornecedor.list('-created_date'),
        base44.entities.Obra.list('-created_date'),
        base44.entities.Contrato.list('-created_date')
      ]);
      setFornecedores(fornecedoresData);
      setObras(obrasData);
      setContratos(contratosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDadosConstrutora = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        setDadosConstrutora({
          razao_social: user.construtora_razao_social || "GOMES E RIBEIRO EMPREENDIMENTOS IMOBILIÁRIOS LTDA",
          cnpj: user.construtora_cnpj || "48.624.524/0001-80",
          endereco: user.construtora_endereco || "Avenida Presidente Castelo Branco, nº 1800, Bloco A1, Apto 360 – Bairro Boqueirão, CEP 11700-015 – Praia Grande/SP",
          representante: user.representante_nome || "Francisco de Assis Lima Gomes",
          nacionalidade: user.representante_nacionalidade || "brasileiro",
          estado_civil: user.representante_estado_civil || "casado",
          naturalidade: user.representante_naturalidade || "cidade de Beberibe/CE",
          rg: user.representante_rg || "16.586.672 SSP/SP",
          cpf: user.representante_cpf || "065.441.068-28",
          profissao: user.representante_profissao || "empresário"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da construtora:', error);
    }
  };

  const handleFornecedorSaved = () => {
    setShowFornecedorForm(false);
    loadData();
  };

  const handleFileUpload = async (contratoId, file) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Contrato.update(contratoId, {
        arquivo_assinado: file_url
      });
      await loadData();
      alert('Contrato assinado enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = async (contratoId) => {
    if (!confirm('Deseja remover o arquivo do contrato assinado?')) return;

    try {
      await base44.entities.Contrato.update(contratoId, {
        arquivo_assinado: null
      });
      await loadData();
      alert('Arquivo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      alert('Erro ao remover arquivo.');
    }
  };

  const handleObraSelect = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    if (obra) {
      setContratoData(prev => ({
        ...prev,
        obra_id: obraId,
        obra_nome: obra.nome || '',
        obra_endereco: obra.endereco || '',
        area_total: obra.area_construida || '',
        valor_m2: obra.valor_mao_obra_m2 || ''
      }));
    } else {
      setContratoData(prev => ({
        ...prev,
        obra_id: '',
        obra_nome: '',
        obra_endereco: '',
        area_total: '',
        valor_m2: ''
      }));
    }
  };

  const calcularDataTermino = () => {
    if (!contratoData.data_inicio || !contratoData.prazo_quantidade) {
      setContratoData(prev => ({ ...prev, data_termino: '' }));
      return;
    }

    const dataInicio = new Date(contratoData.data_inicio + 'T00:00:00');
    const quantidade = parseInt(contratoData.prazo_quantidade);

    if (isNaN(quantidade)) {
      setContratoData(prev => ({ ...prev, data_termino: '' }));
      return;
    }

    let dataTermino = new Date(dataInicio);
    if (contratoData.prazo_unidade === 'meses') {
      dataTermino.setMonth(dataTermino.getMonth() + quantidade);
    } else {
      dataTermino.setDate(dataTermino.getDate() + quantidade);
    }

    dataTermino.setDate(dataTermino.getDate() - 1);

    const year = dataTermino.getFullYear();
    const month = String(dataTermino.getMonth() + 1).padStart(2, '0');
    const day = String(dataTermino.getDate()).padStart(2, '0');

    setContratoData(prev => ({
      ...prev,
      data_termino: `${year}-${month}-${day}`
    }));
  };

  useEffect(() => {
    calcularDataTermino();
  }, [contratoData.data_inicio, contratoData.prazo_quantidade, contratoData.prazo_unidade]);

  const handleAdicionarContratado = () => {
    if (!novoContratado.fornecedor_id) {
      alert('Selecione um fornecedor');
      return;
    }

    const fornecedor = fornecedores.find(f => f.id === novoContratado.fornecedor_id);
    if (!fornecedor) return;

    if (contratoData.contratados.find(c => c.fornecedor_id === fornecedor.id)) {
      alert('Este fornecedor já foi adicionado ao contrato');
      return;
    }

    setContratoData({
      ...contratoData,
      contratados: [...contratoData.contratados, { fornecedor_id: fornecedor.id, fornecedor: fornecedor }]
    });

    setNovoContratado({ fornecedor_id: '' });
  };

  const handleRemoverContratado = (fornecedor_id) => {
    setContratoData({
      ...contratoData,
      contratados: contratoData.contratados.filter(c => c.fornecedor_id !== fornecedor_id)
    });
  };

  const handleGerarContrato = async () => {
    if (!contratoData.tipo_contrato || contratoData.contratados.length === 0 || !contratoData.descricao_servicos) {
      alert('Por favor, preencha todos os campos obrigatórios e adicione pelo menos um contratado');
      return;
    }

    if (!dadosConstrutora) {
      alert('Dados da construtora não carregados. Por favor, atualize a página.');
      return;
    }

    // Função melhorada para converter valor
    const converterValor = (valor) => {
      if (valor === null || valor === undefined || valor === '') return 0;
      
      // Se já é número, retorna
      if (typeof valor === 'number') {
        return parseFloat(valor.toFixed(2));
      }
      
      // Se é string, processa
      if (typeof valor === 'string') {
        // Remove R$, espaços e underscores
        let valorLimpo = valor.trim()
          .replace(/R\$/g, '')
          .replace(/\s/g, '')
          .replace(/_/g, '');
        
        // Conta quantos pontos e vírgulas tem
        const numPontos = (valorLimpo.match(/\./g) || []).length;
        const numVirgulas = (valorLimpo.match(/,/g) || []).length;
        
        // Se tem vírgula, ela é o separador decimal
        if (numVirgulas > 0) {
          // Remove todos os pontos (são separadores de milhar)
          valorLimpo = valorLimpo.replace(/\./g, '');
          // Substitui vírgula por ponto
          valorLimpo = valorLimpo.replace(',', '.');
        }
        // Se só tem pontos e mais de um, o último é decimal
        else if (numPontos > 1) {
          // Remove todos os pontos exceto o último
          const partes = valorLimpo.split('.');
          const ultimoGrupo = partes.pop();
          valorLimpo = partes.join('') + '.' + ultimoGrupo;
        }
        // Se tem só um ponto e o último grupo tem exatamente 2 dígitos, é decimal
        else if (numPontos === 1) {
          const partes = valorLimpo.split('.');
          if (partes[1] && partes[1].length === 2) {
            // Já está correto
          } else {
            // É separador de milhar, remove
            valorLimpo = valorLimpo.replace('.', '');
          }
        }
        
        const numero = parseFloat(valorLimpo);
        if (isNaN(numero)) return 0;
        return parseFloat(numero.toFixed(2));
      }
      
      return 0;
    };

    const dadosParaImpressao = {
      construtora: dadosConstrutora,
      contratados: contratoData.contratados.map(c => c.fornecedor),
      tipo_contrato: contratoData.tipo_contrato === 'construcao_civil' ? 'PRESTAÇÃO DE SERVIÇOS DE CONSTRUÇÃO CIVIL' : contratoData.tipo_contrato_outro.toUpperCase(),
      descricao_servicos: contratoData.descricao_servicos,
      obra_nome: contratoData.obra_nome,
      obra_endereco: contratoData.obra_endereco,
      area_total: contratoData.area_total,
      valor_total: converterValor(contratoData.valor_total),
      valor_m2: converterValor(contratoData.valor_m2),
      forma_pagamento: contratoData.forma_pagamento,
      data_inicio: contratoData.data_inicio,
      prazo_quantidade: contratoData.prazo_quantidade,
      prazo_unidade: contratoData.prazo_unidade,
      data_termino: contratoData.data_termino,
      data_assinatura: new Date().toISOString().split('T')[0]
    };

    try {
      await base44.entities.Contrato.create({
        tipo_contrato: contratoData.tipo_contrato,
        tipo_contrato_outro: contratoData.tipo_contrato_outro || null,
        descricao_servicos: contratoData.descricao_servicos,
        obra_id: contratoData.obra_id || null,
        obra_nome: contratoData.obra_nome || null,
        obra_endereco: contratoData.obra_endereco || null,
        area_total: contratoData.area_total ? String(contratoData.area_total) : null,
        valor_total: converterValor(contratoData.valor_total),
        valor_m2: converterValor(contratoData.valor_m2),
        forma_pagamento: contratoData.forma_pagamento || null,
        data_inicio: contratoData.data_inicio || null,
        prazo_quantidade: contratoData.prazo_quantidade ? String(contratoData.prazo_quantidade) : null,
        prazo_unidade: contratoData.prazo_unidade,
        data_termino: contratoData.data_termino || null,
        data_assinatura: dadosParaImpressao.data_assinatura,
        contratados_ids: contratoData.contratados.map(c => c.fornecedor_id),
        status: 'ativo'
      });

      loadData();
      setShowContratoForm(false);
      setContratoData({
        tipo_contrato: 'construcao_civil',
        tipo_contrato_outro: '',
        descricao_servicos: '',
        obra_id: '',
        obra_nome: '',
        obra_endereco: '',
        area_total: '',
        valor_total: '',
        valor_m2: '',
        forma_pagamento: '',
        data_inicio: '',
        prazo_quantidade: '',
        prazo_unidade: 'meses',
        data_termino: '',
        contratados: []
      });
      setNovoContratado({ fornecedor_id: '' });

    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      alert('Erro ao salvar contrato: ' + (error.message || 'Erro desconhecido'));
      return;
    }

    setDadosImpressao(dadosParaImpressao);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleVisualizarContrato = async (contrato) => {
    if (!dadosConstrutora) {
      alert('Dados da construtora não carregados.');
      return;
    }

    const contratadosCompletos = await Promise.all(
      (contrato.contratados_ids || []).map(async (id) => {
        return fornecedores.find(f => f.id === id);
      })
    );

    const dados = {
      construtora: dadosConstrutora,
      contratados: contratadosCompletos.filter(Boolean),
      tipo_contrato: contrato.tipo_contrato === 'construcao_civil' ? 'PRESTAÇÃO DE SERVIÇOS DE CONSTRUÇÃO CIVIL' : (contrato.tipo_contrato_outro || '').toUpperCase(),
      descricao_servicos: contrato.descricao_servicos,
      obra_nome: contrato.obra_nome,
      obra_endereco: contrato.obra_endereco,
      area_total: contrato.area_total,
      valor_total: contrato.valor_total || 0,
      valor_m2: contrato.valor_m2 || 0,
      forma_pagamento: contrato.forma_pagamento,
      data_inicio: contrato.data_inicio,
      prazo_quantidade: contrato.prazo_quantidade,
      prazo_unidade: contrato.prazo_unidade,
      data_termino: contrato.data_termino,
      data_assinatura: contrato.data_assinatura
    };

    setDadosImpressao(dados);

    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDeleteContrato = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      await base44.entities.Contrato.delete(id);
      loadData();
      alert('Contrato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato.');
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading || !dadosConstrutora) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-hide {
            display: none !important;
          }

          .print-show {
            display: block !important;
          }

          .contract-wrapper {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
            background: white;
          }

          .contract-header {
            display: none !important;
          }

          .contract-body {
            padding: 80pt 40pt 40pt 40pt;
            box-sizing: border-box;
          }

          .contract-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 25pt;
            color: #000;
          }

          .contract-paragraph {
            text-align: justify;
            text-indent: 50pt;
            margin: 15pt 0;
            line-height: 1.8;
            color: #000;
          }

          .contract-paragraph.no-indent {
            text-indent: 0;
          }

          .contract-clause {
            margin: 20pt 0;
            page-break-inside: avoid;
          }

          .contract-clause-title {
            font-weight: bold;
            font-size: 13pt;
            text-transform: uppercase;
            margin-bottom: 10pt;
            color: #000;
          }

          .contract-clause-text {
            text-align: justify;
            line-height: 1.8;
            color: #000;
            margin: 10pt 0;
          }

          .contract-list {
            margin: 10pt 0 10pt 40pt;
            list-style-type: disc;
          }

          .contract-list li {
            margin: 8pt 0;
            text-align: justify;
            line-height: 1.6;
          }

          .contract-subheading {
            font-weight: bold;
            margin: 15pt 0 8pt 0;
          }

          .contract-bank-details {
            margin: 15pt 0 15pt 30pt;
            line-height: 1.6;
          }

          .contract-bank-details p {
            margin: 5pt 0;
          }

          .contract-signatures {
            margin-top: 60pt;
            page-break-inside: avoid;
          }

          .contract-date {
            text-align: right;
            margin-bottom: 40pt;
          }

          .contract-signature-lines {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 30pt;
            margin-top: 20pt;
          }

          .contract-signature-item {
            text-align: center;
            min-width: 180pt;
            flex: 1;
          }

          .contract-signature-line {
            border-top: 1pt solid #000;
            padding-top: 8pt;
            margin-top: 40pt;
          }

          .contract-signature-name {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 3pt;
          }

          .contract-signature-doc {
            font-size: 10pt;
            color: #333;
          }

          strong {
            font-weight: bold;
          }
        }
      `}</style>

      {/* Versão para tela */}
      <div className="print-hide">
        {!showContratoForm && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FileSignature className="w-8 h-8 text-blue-600" />
                Contratos
              </h1>
              <p className="text-slate-600">Gerencie os contratos das suas obras</p>
            </div>
            <Button
              onClick={() => {
                setShowContratoForm(true);
                setContratoData({
                  tipo_contrato: 'construcao_civil',
                  tipo_contrato_outro: '',
                  descricao_servicos: '',
                  obra_id: '',
                  obra_nome: '',
                  obra_endereco: '',
                  area_total: '',
                  valor_total: '',
                  valor_m2: '',
                  forma_pagamento: '',
                  data_inicio: '',
                  prazo_quantidade: '',
                  prazo_unidade: 'meses',
                  data_termino: '',
                  contratados: []
                });
                setNovoContratado({ fornecedor_id: '' });
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        )}

        {!showContratoForm && contratos.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {contratos.map((contrato) => {
              const obra = obras.find(o => o.id === contrato.obra_id);
              const contratados = fornecedores.filter(f =>
                contrato.contratados_ids?.includes(f.id)
              );

              return (
                <Card key={contrato.id} className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-slate-800">
                            {contrato.tipo_contrato === 'construcao_civil' ? 'Contrato de Construção Civil' : contrato.tipo_contrato_outro}
                          </h3>
                          <Badge className={
                            contrato.status === 'ativo' ? 'bg-green-100 text-green-800' :
                            contrato.status === 'concluido' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {contrato.status === 'ativo' ? 'Ativo' :
                             contrato.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <p className="font-semibold">Obra:</p>
                            <p>{obra?.nome || 'Obra não encontrada'}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Valor Total:</p>
                            <p className="text-lg font-bold text-blue-600">
                              R$ {formatCurrency(contrato.valor_total || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">Período:</p>
                            <p>
                              {contrato.data_inicio ? format(new Date(contrato.data_inicio), 'dd/MM/yyyy', { locale: ptBR }) : '-'} até{' '}
                              {contrato.data_termino ? format(new Date(contrato.data_termino), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">Data de Assinatura:</p>
                            <p>{contrato.data_assinatura ? format(new Date(contrato.data_assinatura), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                          </div>
                        </div>

                        {contratados.length > 0 && (
                          <div className="mt-4">
                            <p className="font-semibold text-sm text-slate-600 mb-2">Contratados:</p>
                            <div className="flex flex-wrap gap-2">
                              {contratados.map(c => (
                                <Badge key={c.id} variant="outline">{c.nome}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Seção de Arquivo Assinado */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="font-semibold text-sm text-slate-600 mb-2">Contrato Assinado:</p>
                          {contrato.arquivo_assinado ? (
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(contrato.arquivo_assinado, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar Arquivo
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveFile(contrato.id)}
                                disabled={uploadingFile}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept="application/pdf"
                                id={`upload-${contrato.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleFileUpload(contrato.id, file);
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`upload-${contrato.id}`).click()}
                                disabled={uploadingFile}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {uploadingFile ? 'Enviando...' : 'Anexar Contrato Assinado'}
                              </Button>
                              <p className="text-xs text-slate-500">Apenas arquivos PDF</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleVisualizarContrato(contrato)}
                          title="Visualizar/Imprimir"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteContrato(contrato.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!showContratoForm && contratos.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileSignature className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Nenhum contrato cadastrado</h3>
              <p className="text-slate-500">Clique em "Novo Contrato" para começar.</p>
            </CardContent>
          </Card>
        )}

        {showContratoForm && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Novo Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900">Tipo de Contrato</h3>
                <div className="space-y-2">
                  <Label htmlFor="tipo_contrato">Tipo *</Label>
                  <Select value={contratoData.tipo_contrato} onValueChange={(value) => setContratoData({...contratoData, tipo_contrato: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construcao_civil">Prestação de Serviços de Construção Civil</SelectItem>
                      <SelectItem value="outro">Outro tipo de serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contratoData.tipo_contrato === 'outro' && (
                  <div className="space-y-2">
                    <Label htmlFor="tipo_contrato_outro">Especifique o tipo de serviço *</Label>
                    <Input
                      id="tipo_contrato_outro"
                      value={contratoData.tipo_contrato_outro}
                      onChange={(e) => setContratoData({...contratoData, tipo_contrato_outro: e.target.value})}
                      placeholder="Ex: Prestação de Serviços de Pintura"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900">Contratado(s)</h3>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={novoContratado.fornecedor_id} onValueChange={(value) => setNovoContratado({fornecedor_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(fornecedor => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome} - {fornecedor.cpf_cnpj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdicionarContratado} type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button onClick={() => setShowFornecedorForm(true)} type="button" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Fornecedor
                  </Button>
                </div>

                {contratoData.contratados.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label>Contratados adicionados:</Label>
                    {contratoData.contratados.map((contratado) => (
                      <div key={contratado.fornecedor_id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium">{contratado.fornecedor.nome}</p>
                          <p className="text-sm text-slate-500">{contratado.fornecedor.cpf_cnpj}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverContratado(contratado.fornecedor_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900">Dados da Obra</h3>

                <div className="space-y-2">
                  <Label htmlFor="obra_select">Selecionar Obra Existente (opcional)</Label>
                  <Select
                    value={contratoData.obra_id || '__none__'}
                    onValueChange={(value) => handleObraSelect(value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma obra ou preencha manualmente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Preencher manualmente</SelectItem>
                      {obras.map(obra => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.nome} - {obra.endereco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Ao selecionar uma obra, os campos abaixo serão preenchidos automaticamente
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="obra_nome">Nome da Obra</Label>
                    <Input
                      id="obra_nome"
                      value={contratoData.obra_nome}
                      onChange={(e) => setContratoData({...contratoData, obra_nome: e.target.value})}
                      placeholder="Ex: Residencial Ipanema II"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_total">Área Total (m²)</Label>
                    <Input
                      id="area_total"
                      type="number"
                      step="0.01"
                      value={contratoData.area_total}
                      onChange={(e) => setContratoData({...contratoData, area_total: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obra_endereco">Endereço da Obra</Label>
                  <Textarea
                    id="obra_endereco"
                    value={contratoData.obra_endereco}
                    onChange={(e) => setContratoData({...contratoData, obra_endereco: e.target.value})}
                    placeholder="Rua, número, bairro, cidade/estado"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900">Valores e Pagamento</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_total">Valor Total</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                      <Input
                        id="valor_total"
                        type="text" // Changed to text to handle currency format before conversion
                        value={contratoData.valor_total}
                        onChange={(e) => setContratoData({...contratoData, valor_total: e.target.value})}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_m2">Valor por m²</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                      <Input
                        id="valor_m2"
                        type="text" // Changed to text to handle currency format before conversion
                        value={contratoData.valor_m2}
                        onChange={(e) => setContratoData({...contratoData, valor_m2: e.target.value})}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Textarea
                    id="forma_pagamento"
                    value={contratoData.forma_pagamento}
                    onChange={(e) => setContratoData({...contratoData, forma_pagamento: e.target.value})}
                    placeholder="Ex: Sinal de R$ 60.000,00 no dia 20/08/2025. Saldo em 9 parcelas mensais de R$ 30.000,00"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Prazos</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={contratoData.data_inicio}
                      onChange={(e) => setContratoData({...contratoData, data_inicio: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prazo_quantidade">Prazo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="prazo_quantidade"
                        type="number"
                        value={contratoData.prazo_quantidade}
                        onChange={(e) => setContratoData({...contratoData, prazo_quantidade: e.target.value})}
                        placeholder="10"
                        className="flex-1"
                      />
                      <Select
                        value={contratoData.prazo_unidade}
                        onValueChange={(value) => setContratoData({...contratoData, prazo_unidade: value})}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dias">Dias</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_termino">Data de Término (calculada)</Label>
                    <Input
                      id="data_termino"
                      type="date"
                      value={contratoData.data_termino}
                      readOnly
                      className="bg-slate-100"
                    />
                  </div>
                </div>

                {contratoData.data_termino && (
                  <p className="text-xs text-slate-500">
                    ℹ️ Data de término calculada automaticamente com base na data de início e prazo informado
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_servicos">Descrição dos Serviços *</Label>
                <Textarea
                  id="descricao_servicos"
                  value={contratoData.descricao_servicos}
                  onChange={(e) => setContratoData({...contratoData, descricao_servicos: e.target.value})}
                  placeholder="Descreva detalhadamente os serviços que serão executados..."
                  rows={8}
                />
                <p className="text-xs text-slate-500">
                  Exemplo: Execução do projeto estrutural, arquitetônico, elétrico e hidráulico; Demolição inicial; Carpintaria; Ferragem; etc.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleGerarContrato} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Download className="w-4 h-4 mr-2" />
                  Salvar e Imprimir Contrato
                </Button>
                <Button variant="outline" onClick={() => setShowContratoForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Versão para impressão */}
      {dadosImpressao && (
        <div className="print-show" style={{display: 'none'}}>
          <div className="contract-wrapper">
            <div className="contract-body">
              <h1 className="contract-title">
                CONTRATO DE {dadosImpressao.tipo_contrato}
              </h1>

              <p className="contract-paragraph">
                Pelo presente instrumento particular de <strong>CONTRATO DE {dadosImpressao.tipo_contrato}</strong>, de um lado, o <strong>CONTRATANTE</strong>, <strong>{dadosImpressao.construtora.razao_social}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{dadosImpressao.construtora.cnpj}</strong>, com sede na {dadosImpressao.construtora.endereco}, neste ato representada por seu Sócio Administrador <strong>{dadosImpressao.construtora.representante}</strong>,{dadosImpressao.construtora.nacionalidade}, {dadosImpressao.construtora.estado_civil}, natural da {dadosImpressao.construtora.naturalidade}, portador do RG nº {dadosImpressao.construtora.rg} e CPF nº {dadosImpressao.construtora.cpf}, {dadosImpressao.construtora.profissao}, residente e domiciliado no mesmo endereço da sede da empresa.
              </p>

              {dadosImpressao.contratados.map((contratado, index) => (
                <p key={index} className="contract-paragraph">
                  {index === 0 ? 'E, de outro lado, o' : 'E o'} <strong>CONTRATADO</strong>, <strong>{contratado.nome}</strong>,
                  {contratado.tipo === 'juridica' ? (
                    <>
                      pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{contratado.cpf_cnpj}</strong>
                      {contratado.endereco_completo && <>, com sede na {contratado.endereco_completo}</>}
                      {contratado.representante_nome && (
                        <>, neste ato representada por seu Sócio Administrador <strong>{contratado.representante_nome}</strong></>
                      )}
                      {contratado.representante_nacionalidade && <>, {contratado.representante_nacionalidade}</>}
                      {contratado.representante_estado_civil && <>, {contratado.representante_estado_civil}</>}
                      {contratado.representante_naturalidade && <>, natural da {contratado.representante_naturalidade}</>}
                      {contratado.representante_data_nascimento && (
                        <>, nascido em {(() => {
                          const [year, month, day] = contratado.representante_data_nascimento.split('-');
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          return format(date, 'dd/MM/yyyy');
                        })()}</>
                      )}
                      {contratado.representante_rg && <>, portador do RG nº {contratado.representante_rg}</>}
                      {contratado.representante_cpf && <> e CPF nº {contratado.representante_cpf}</>}
                      {contratado.representante_profissao && <>, {contratado.representante_profissao}</>}
                      {contratado.representante_endereco_completo && <>, residente e domiciliado {contratado.representante_mesmo_endereco ? 'no mesmo endereço da sede da empresa' : `em ${contratado.representante_endereco_completo}`}</>},
                    </>
                  ) : (
                    <>
                      {contratado.estado_civil && <>{contratado.estado_civil}, </>}
                      {contratado.naturalidade && <>natural da {contratado.naturalidade}, </>}
                      {contratado.rg && <>portador do RG nº <strong>{contratado.rg}</strong></>}
                      {contratado.cpf_cnpj && <> e CPF nº <strong>{contratado.cpf_cnpj}</strong></>}
                      {contratado.profissao && <>, {contratado.profissao}</>}
                      {contratado.endereco_completo && <>, residente e domiciliado em {contratado.endereco_completo}</>},
                    </>
                  )}
                </p>
              ))}

              <p className="contract-paragraph">
                Têm entre si, justo e contratado, o presente instrumento, que se regerá pelas cláusulas e condições a seguir.
              </p>

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 1 – DO OBJETO</div>
                <p className="contract-clause-text">
                  O presente contrato tem por objeto a execução, pelo CONTRATADO, de serviços
                  {dadosImpressao.obra_nome && <> referentes à obra denominada <strong>"{dadosImpressao.obra_nome}"</strong></>}
                  {dadosImpressao.obra_endereco && <>, localizada em {dadosImpressao.obra_endereco}</>}
                  {dadosImpressao.area_total && <>, com área total construída de {dadosImpressao.area_total} m²</>}, abrangendo os seguintes serviços:
                </p>
                <p className="contract-clause-text">{dadosImpressao.descricao_servicos}</p>
              </div>

              {dadosImpressao.valor_total > 0 && (
                <div className="contract-clause">
                  <div className="contract-clause-title">CLÁUSULA 2 – DO VALOR{dadosImpressao.valor_m2 > 0 ? ' E DO M²' : ''}</div>
                  <p className="contract-clause-text">
                    O valor total {dadosImpressao.tipo_contrato.includes('MÃO DE OBRA') || dadosImpressao.tipo_contrato.includes('CONSTRUÇÃO') ? 'da mão de obra ' : ''}
                    ajustado entre as partes é de <strong>R$ {dadosImpressao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    {dadosImpressao.valor_m2 > 0 && <>, correspondente ao valor de <strong>R$ {dadosImpressao.valor_m2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> por metro quadrado</>}.
                  </p>
                </div>
              )}

              {dadosImpressao.forma_pagamento && (
                <div className="contract-clause">
                  <div className="contract-clause-title">CLÁUSULA 3 – DA FORMA DE PAGAMENTO</div>
                  <p className="contract-clause-text">{dadosImpressao.forma_pagamento}</p>

                  {dadosImpressao.contratados.length > 0 && dadosImpressao.contratados[0].banco && (
                    <>
                      <p className="contract-subheading">Parágrafo único:</p>
                      <p className="contract-clause-text">
                        Todos os pagamentos previstos neste contrato deverão ser efetuados por transferência bancária ou depósito identificado em favor do CONTRATADO, na seguinte conta:
                      </p>
                      <div className="contract-bank-details">
                        <p><strong>Banco:</strong> {dadosImpressao.contratados[0].banco}</p>
                        {dadosImpressao.contratados[0].agencia && <p><strong>Agência:</strong> {dadosImpressao.contratados[0].agencia}</p>}
                        {dadosImpressao.contratados[0].conta_corrente && <p><strong>Conta Corrente:</strong> {dadosImpressao.contratados[0].conta_corrente}</p>}
                        {dadosImpressao.contratados[0].titular_conta && (
                          <p><strong>Titular:</strong> {dadosImpressao.contratados[0].titular_conta} – CPF/CNPJ: {dadosImpressao.contratados[0].cpf_cnpj_titular || dadosImpressao.contratados[0].cpf_cnpj}</p>
                        )}
                      </div>
                      <p className="contract-clause-text">
                        Considerar-se-á quitada a parcela somente após a efetiva compensação do valor na conta acima indicada.
                      </p>
                    </>
                  )}
                </div>
              )}

              {(dadosImpressao.data_inicio || dadosImpressao.prazo_quantidade || dadosImpressao.data_termino) && (
                <div className="contract-clause">
                  <div className="contract-clause-title">CLÁUSULA 4 – DO PRAZO DE EXECUÇÃO</div>
                  <p className="contract-clause-text">
                    {dadosImpressao.data_inicio && <>A obra terá início em <strong>{(() => {
                      const [year, month, day] = dadosImpressao.data_inicio.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return format(date, 'dd/MM/yyyy', { locale: ptBR });
                    })()}</strong></>}
                    {dadosImpressao.prazo_quantidade && <> e prazo total de execução de <strong>{dadosImpressao.prazo_quantidade} ({dadosImpressao.prazo_unidade === 'meses' ? (dadosImpressao.prazo_quantidade === '1' ? 'um mês' : `${dadosImpressao.prazo_quantidade} meses`) : (dadosImpressao.prazo_quantidade === '1' ? 'um dia' : `${dadosImpressao.prazo_quantidade} dias`)})</strong></>}
                    {dadosImpressao.data_termino && <>, com término previsto para <strong>{(() => {
                      const [year, month, day] = dadosImpressao.data_termino.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return format(date, 'dd/MM/yyyy', { locale: ptBR });
                    })()}</strong></>}.
                  </p>
                  <p className="contract-subheading">Parágrafo único:</p>
                  <p className="contract-clause-text">O prazo poderá ser prorrogado, mediante termo aditivo, exclusivamente nas seguintes hipóteses:</p>
                  <ul className="contract-list">
                    <li>Ocorrência de força maior ou caso fortuito, nos termos do artigo 393 do Código Civil Brasileiro, devidamente comprovados;</li>
                    <li>Alterações no projeto solicitadas pelo CONTRATANTE que impliquem ajustes no cronograma;</li>
                    <li>Condições climáticas que impossibilitem a execução segura e adequada dos serviços.</li>
                  </ul>
                </div>
              )}

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 5 – DAS OBRIGAÇÕES DO CONTRATADO</div>
                <p className="contract-clause-text">O CONTRATADO se obriga a:</p>
                <ul className="contract-list">
                  <li>Executar todos os serviços conforme projetos arquitetônico, estrutural, elétrico e hidráulico fornecidos pelo CONTRATANTE, observando rigorosamente as normas técnicas da ABNT e demais regulamentações aplicáveis;</li>
                  <li>Utilizar ferramentas de pequeno porte de sua própria responsabilidade;</li>
                  <li>Administrar integralmente os serviços descritos no escopo, garantindo a coordenação das equipes e a observância do cronograma físico-financeiro da obra;</li>
                  <li>Manter no canteiro de obras um responsável técnico devidamente habilitado.</li>
                </ul>

                <p className="contract-subheading">Parágrafo único – Das Garantias:</p>
                <p className="contract-clause-text">O CONTRATADO se responsabiliza pela qualidade dos serviços prestados, observando-se que:</p>
                <ul className="contract-list">
                  <li>Os serviços de estrutura, pisos e revestimentos cerâmicos (azulejos) terão garantia de 5 (cinco) anos, contados da entrega da obra, em conformidade com o artigo 618 do Código Civil;</li>
                  <li>Os demais serviços terão garantia apenas quanto à execução correta, segurança e ao funcionamento imediato, não se estendendo além do prazo legal previsto;</li>
                  <li>A garantia não abrange defeitos decorrentes de mau uso, falta de manutenção, reformas posteriores, ou uso de materiais fornecidos pelo CONTRATANTE que apresentem vício de qualidade.</li>
                  </ul>
              </div>

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 6 – DAS OBRIGAÇÕES DO CONTRATANTE</div>
                <p className="contract-clause-text">O CONTRATANTE se obriga a:</p>
                <ul className="contract-list">
                  <li>Fornecer todos os materiais necessários para execução dos serviços, dentro dos prazos acordados;</li>
                  <li>Liberar o acesso à obra e disponibilizar as frentes de serviço de acordo com o cronograma;</li>
                  <li>Efetuar os pagamentos na forma e prazos estipulados neste contrato;</li>
                  <li>Fornecer os projetos e especificações técnicas necessárias à execução da obra.</li>
                </ul>
              </div>

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 7 – DA RESCISÃO</div>
                <p className="contract-clause-text">O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias, nas seguintes hipóteses:</p>
                <ul className="contract-list">
                  <li>Descumprimento de quaisquer cláusulas contratuais;</li>
                  <li>Falência, recuperação judicial ou insolvência de qualquer das partes;</li>
                  <li>Atraso no pagamento superior a 30 (trinta) dias, por parte do CONTRATANTE;</li>
                  <li>Atraso injustificado na execução dos serviços superior a 30 (trinta) dias, por parte do CONTRATADO.</li>
                </ul>
              </div>

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 8 – DISPOSIÇÕES GERAIS</div>
                <p className="contract-clause-text">Este contrato não estabelece vínculo empregatício entre as partes, sendo o CONTRATADO autônomo e responsável por todas as obrigações trabalhistas, previdenciárias e fiscais de sua equipe.</p>
                <p className="contract-clause-text">Eventuais alterações de projeto, serviços ou valores deverão ser formalizadas por termo aditivo assinado por ambas as partes.</p>
              </div>

              <div className="contract-clause">
                <div className="contract-clause-title">CLÁUSULA 9 – DO FORO</div>
                <p className="contract-clause-text">Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da Comarca de Praia Grande/SP, renunciando a qualquer outro, por mais privilegiado que seja.</p>
              </div>

              <p className="contract-paragraph no-indent">
                E por estarem de acordo com todas as cláusulas e condições, as partes assinam o presente contrato em duas vias de igual teor, na presença das testemunhas abaixo.
              </p>

              <div className="contract-signatures">
                <div className="contract-date">
                  <p>Praia Grande/SP, {dadosImpressao.data_assinatura && format(new Date(dadosImpressao.data_assinatura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>

                <div className="contract-signature-lines">
                  <div className="contract-signature-item">
                    <div className="contract-signature-line">
                      <p className="contract-signature-name">{dadosImpressao.construtora.razao_social}</p>
                      <p className="contract-signature-doc">CNPJ Nº {dadosImpressao.construtora.cnpj}</p>
                    </div>
                  </div>

                  {dadosImpressao.contratados.map((contratado, index) => (
                    <div key={index} className="contract-signature-item">
                      <div className="contract-signature-line">
                        <p className="contract-signature-name">{contratado.nome}</p>
                        <p className="contract-signature-doc">{contratado.tipo === 'juridica' ? 'CNPJ' : 'CPF'} Nº {contratado.cpf_cnpj}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFornecedorForm && (
        <FornecedorForm
          onSave={handleFornecedorSaved}
          onCancel={() => setShowFornecedorForm(false)}
        />
      )}
    </div>
  );
}
