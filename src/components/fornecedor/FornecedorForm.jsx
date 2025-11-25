import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Search } from "lucide-react";

export default function FornecedorForm({ fornecedor, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    tipo: fornecedor?.tipo || 'fisica', // SEMPRE inicializa com um valor padrão
    nome: fornecedor?.nome || '',
    nome_fantasia: fornecedor?.nome_fantasia || '',
    cpf_cnpj: fornecedor?.cpf_cnpj || '',
    rg: fornecedor?.rg || '',
    data_nascimento: fornecedor?.data_nascimento || '',
    estado_civil: fornecedor?.estado_civil || '',
    profissao: fornecedor?.profissao || '',
    naturalidade: fornecedor?.naturalidade || '',
    cep: fornecedor?.cep || '',
    logradouro: fornecedor?.logradouro || '',
    numero: fornecedor?.numero || '',
    complemento: fornecedor?.complemento || '',
    bairro: fornecedor?.bairro || '',
    cidade: fornecedor?.cidade || '',
    estado: fornecedor?.estado || '',
    representante_nome: fornecedor?.representante_nome || '',
    representante_cpf: fornecedor?.representante_cpf || '',
    representante_rg: fornecedor?.representante_rg || '',
    representante_data_nascimento: fornecedor?.representante_data_nascimento || '',
    representante_estado_civil: fornecedor?.representante_estado_civil || '',
    representante_profissao: fornecedor?.representante_profissao || '',
    representante_naturalidade: fornecedor?.representante_naturalidade || '',
    representante_mesmo_endereco: fornecedor?.representante_mesmo_endereco || false,
    representante_cep: fornecedor?.representante_cep || '',
    representante_logradouro: fornecedor?.representante_logradouro || '',
    representante_numero: fornecedor?.representante_numero || '',
    representante_complemento: fornecedor?.representante_complemento || '',
    representante_bairro: fornecedor?.representante_bairro || '',
    representante_cidade: fornecedor?.representante_cidade || '',
    representante_estado: fornecedor?.representante_estado || '',
    banco: fornecedor?.banco || '',
    agencia: fornecedor?.agencia || '',
    conta_corrente: fornecedor?.conta_corrente || '',
    titular_conta: fornecedor?.titular_conta || '',
    cpf_cnpj_titular: fornecedor?.cpf_cnpj_titular || '',
    pix: fornecedor?.pix || '',
    telefone: fornecedor?.telefone || '',
    email: fornecedor?.email || '',
    observacoes: fornecedor?.observacoes || ''
  });

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCepRepresentante, setBuscandoCepRepresentante] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buscarCep = async (cep, isRepresentante = false) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;

    if (isRepresentante) {
      setBuscandoCepRepresentante(true);
    } else {
      setBuscandoCep(true);
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        if (isRepresentante) {
          setFormData(prev => ({
            ...prev,
            representante_logradouro: data.logradouro || '',
            representante_bairro: data.bairro || '',
            representante_cidade: data.localidade || '',
            representante_estado: data.uf || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      if (isRepresentante) {
        setBuscandoCepRepresentante(false);
      } else {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.tipo || !formData.nome) {
      alert('Por favor, preencha os campos obrigatórios (Tipo e Nome)');
      return;
    }

    // Montar endereço completo
    const enderecoCompleto = [
      formData.logradouro,
      formData.numero ? `nº ${formData.numero}` : '',
      formData.complemento,
      formData.bairro,
      formData.cidade && formData.estado ? `${formData.cidade}/${formData.estado}` : '',
      formData.cep ? `CEP ${formData.cep}` : ''
    ].filter(Boolean).join(', ');

    const representanteEnderecoCompleto = formData.representante_mesmo_endereco 
      ? enderecoCompleto
      : [
          formData.representante_logradouro,
          formData.representante_numero ? `nº ${formData.representante_numero}` : '',
          formData.representante_complemento,
          formData.representante_bairro,
          formData.representante_cidade && formData.representante_estado ? `${formData.representante_cidade}/${formData.representante_estado}` : '',
          formData.representante_cep ? `CEP ${formData.representante_cep}` : ''
        ].filter(Boolean).join(', ');

    const dataToSave = {
      ...formData,
      endereco_completo: enderecoCompleto || null,
      representante_endereco_completo: representanteEnderecoCompleto || null,
      // Garantir que campos vazios sejam null ao invés de string vazia
      nome_fantasia: formData.nome_fantasia || null,
      cpf_cnpj: formData.cpf_cnpj || null,
      rg: formData.rg || null,
      data_nascimento: formData.data_nascimento || null,
      estado_civil: formData.estado_civil || null,
      profissao: formData.profissao || null,
      naturalidade: formData.naturalidade || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      observacoes: formData.observacoes || null
    };

    try {
      if (fornecedor?.id) {
        await base44.entities.Fornecedor.update(fornecedor.id, dataToSave);
      } else {
        await base44.entities.Fornecedor.create(dataToSave);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const isPessoaFisica = formData.tipo === 'fisica';
  const isPessoaJuridica = formData.tipo === 'juridica';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 bg-white">
        <CardHeader className="border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">
              {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Pessoa */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="tipo">Tipo de Pessoa *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => handleChange('tipo', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados Principais - Pessoa Física */}
            {isPessoaFisica && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleChange('rg', e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => handleChange('data_nascimento', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <Select value={formData.estado_civil} onValueChange={(value) => handleChange('estado_civil', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao_estavel">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      value={formData.profissao}
                      onChange={(e) => handleChange('profissao', e.target.value)}
                      placeholder="Ex: Engenheiro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="naturalidade">Naturalidade</Label>
                    <Input
                      id="naturalidade"
                      value={formData.naturalidade}
                      onChange={(e) => handleChange('naturalidade', e.target.value)}
                      placeholder="Ex: São Paulo/SP"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dados Principais - Pessoa Jurídica */}
            {isPessoaJuridica && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Dados da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nome">Razão Social *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Razão social da empresa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      value={formData.nome_fantasia}
                      onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                      placeholder="Nome fantasia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Endereço */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => {
                        handleChange('cep', e.target.value);
                        if (e.target.value.replace(/\D/g, '').length === 8) {
                          buscarCep(e.target.value);
                        }
                      }}
                      placeholder="00000-000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => buscarCep(formData.cep)}
                      disabled={buscandoCep}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => handleChange('logradouro', e.target.value)}
                    placeholder="Rua, Avenida..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    placeholder="Nº"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => handleChange('complemento', e.target.value)}
                    placeholder="Apto, Bloco..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Dados do Representante Legal (só para PJ) */}
            {isPessoaJuridica && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900">Dados do Representante Legal</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="representante_nome">Nome do Representante</Label>
                    <Input
                      id="representante_nome"
                      value={formData.representante_nome}
                      onChange={(e) => handleChange('representante_nome', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_cpf">CPF</Label>
                    <Input
                      id="representante_cpf"
                      value={formData.representante_cpf}
                      onChange={(e) => handleChange('representante_cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_rg">RG</Label>
                    <Input
                      id="representante_rg"
                      value={formData.representante_rg}
                      onChange={(e) => handleChange('representante_rg', e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="representante_data_nascimento"
                      type="date"
                      value={formData.representante_data_nascimento}
                      onChange={(e) => handleChange('representante_data_nascimento', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_estado_civil">Estado Civil</Label>
                    <Select value={formData.representante_estado_civil} onValueChange={(value) => handleChange('representante_estado_civil', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao_estavel">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_profissao">Profissão</Label>
                    <Input
                      id="representante_profissao"
                      value={formData.representante_profissao}
                      onChange={(e) => handleChange('representante_profissao', e.target.value)}
                      placeholder="Ex: Engenheiro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representante_naturalidade">Naturalidade</Label>
                    <Input
                      id="representante_naturalidade"
                      value={formData.representante_naturalidade}
                      onChange={(e) => handleChange('representante_naturalidade', e.target.value)}
                      placeholder="Ex: São Paulo/SP"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="representante_mesmo_endereco"
                        checked={formData.representante_mesmo_endereco}
                        onCheckedChange={(checked) => handleChange('representante_mesmo_endereco', checked)}
                      />
                      <label htmlFor="representante_mesmo_endereco" className="text-sm font-medium">
                        Representante reside no mesmo endereço da empresa
                      </label>
                    </div>
                  </div>

                  {!formData.representante_mesmo_endereco && (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <h4 className="font-medium text-purple-800 text-sm">Endereço do Representante</h4>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_cep">CEP</Label>
                        <div className="flex gap-2">
                          <Input
                            id="representante_cep"
                            value={formData.representante_cep}
                            onChange={(e) => {
                              handleChange('representante_cep', e.target.value);
                              if (e.target.value.replace(/\D/g, '').length === 8) {
                                buscarCep(e.target.value, true);
                              }
                            }}
                            placeholder="00000-000"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => buscarCep(formData.representante_cep, true)}
                            disabled={buscandoCepRepresentante}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="representante_logradouro">Logradouro</Label>
                        <Input
                          id="representante_logradouro"
                          value={formData.representante_logradouro}
                          onChange={(e) => handleChange('representante_logradouro', e.target.value)}
                          placeholder="Rua, Avenida..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_numero">Número</Label>
                        <Input
                          id="representante_numero"
                          value={formData.representante_numero}
                          onChange={(e) => handleChange('representante_numero', e.target.value)}
                          placeholder="Nº"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_complemento">Complemento</Label>
                        <Input
                          id="representante_complemento"
                          value={formData.representante_complemento}
                          onChange={(e) => handleChange('representante_complemento', e.target.value)}
                          placeholder="Apto, Bloco..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_bairro">Bairro</Label>
                        <Input
                          id="representante_bairro"
                          value={formData.representante_bairro}
                          onChange={(e) => handleChange('representante_bairro', e.target.value)}
                          placeholder="Bairro"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_cidade">Cidade</Label>
                        <Input
                          id="representante_cidade"
                          value={formData.representante_cidade}
                          onChange={(e) => handleChange('representante_cidade', e.target.value)}
                          placeholder="Cidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_estado">Estado</Label>
                        <Input
                          id="representante_estado"
                          value={formData.representante_estado}
                          onChange={(e) => handleChange('representante_estado', e.target.value)}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Dados Bancários */}
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900">Dados Bancários</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={formData.banco}
                    onChange={(e) => handleChange('banco', e.target.value)}
                    placeholder="Nome do banco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    value={formData.agencia}
                    onChange={(e) => handleChange('agencia', e.target.value)}
                    placeholder="0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conta_corrente">Conta Corrente</Label>
                  <Input
                    id="conta_corrente"
                    value={formData.conta_corrente}
                    onChange={(e) => handleChange('conta_corrente', e.target.value)}
                    placeholder="00000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    value={formData.pix}
                    onChange={(e) => handleChange('pix', e.target.value)}
                    placeholder="CPF, email, telefone..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titular_conta">Titular da Conta</Label>
                  <Input
                    id="titular_conta"
                    value={formData.titular_conta}
                    onChange={(e) => handleChange('titular_conta', e.target.value)}
                    placeholder="Nome do titular"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj_titular">CPF/CNPJ do Titular</Label>
                  <Input
                    id="cpf_cnpj_titular"
                    value={formData.cpf_cnpj_titular}
                    onChange={(e) => handleChange('cpf_cnpj_titular', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Contato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Save className="w-4 h-4 mr-2" />
                Salvar Fornecedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}