import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Search } from "lucide-react";

export default function PessoaForm({ pessoa, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    tipo: pessoa?.tipo || 'fisica',
    nome: pessoa?.nome || '',
    nome_fantasia: pessoa?.nome_fantasia || '',
    cpf_cnpj: pessoa?.cpf_cnpj || '',
    rg: pessoa?.rg || '',
    data_nascimento: pessoa?.data_nascimento || '',
    estado_civil: pessoa?.estado_civil || '',
    profissao: pessoa?.profissao || '',
    naturalidade: pessoa?.naturalidade || '',
    cep: pessoa?.cep || '',
    logradouro: pessoa?.logradouro || '',
    numero: pessoa?.numero || '',
    complemento: pessoa?.complemento || '',
    bairro: pessoa?.bairro || '',
    cidade: pessoa?.cidade || '',
    estado: pessoa?.estado || '',
    representante_nome: pessoa?.representante_nome || '',
    representante_cpf: pessoa?.representante_cpf || '',
    representante_rg: pessoa?.representante_rg || '',
    representante_data_nascimento: pessoa?.representante_data_nascimento || '',
    representante_estado_civil: pessoa?.representante_estado_civil || '',
    representante_profissao: pessoa?.representante_profissao || '',
    representante_naturalidade: pessoa?.representante_naturalidade || '',
    representante_mesmo_endereco: pessoa?.representante_mesmo_endereco || false,
    representante_cep: pessoa?.representante_cep || '',
    representante_logradouro: pessoa?.representante_logradouro || '',
    representante_numero: pessoa?.representante_numero || '',
    representante_complemento: pessoa?.representante_complemento || '',
    representante_bairro: pessoa?.representante_bairro || '',
    representante_cidade: pessoa?.representante_cidade || '',
    representante_estado: pessoa?.representante_estado || '',
    banco: pessoa?.banco || '',
    agencia: pessoa?.agencia || '',
    conta_corrente: pessoa?.conta_corrente || '',
    titular_conta: pessoa?.titular_conta || '',
    cpf_cnpj_titular: pessoa?.cpf_cnpj_titular || '',
    pix: pessoa?.pix || '',
    telefone: pessoa?.telefone || '',
    email: pessoa?.email || '',
    observacoes: pessoa?.observacoes || ''
  });

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCepRepresentante, setBuscandoCepRepresentante] = useState(false);

  const buscarCep = async (cep, isRepresentante = false) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      alert('CEP inválido');
      return;
    }

    if (isRepresentante) {
      setBuscandoCepRepresentante(true);
    } else {
      setBuscandoCep(true);
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado');
        return;
      }

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
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP');
    } finally {
      if (isRepresentante) {
        setBuscandoCepRepresentante(false);
      } else {
        setBuscandoCep(false);
      }
    }
  };

  const formatarEnderecoCompleto = () => {
    const partes = [];
    if (formData.logradouro) partes.push(formData.logradouro);
    if (formData.numero) partes.push(`nº ${formData.numero}`);
    if (formData.complemento) partes.push(formData.complemento);
    if (formData.bairro) partes.push(`Bairro ${formData.bairro}`);
    if (formData.cidade && formData.estado) partes.push(`${formData.cidade}/${formData.estado}`);
    if (formData.cep) partes.push(`CEP ${formData.cep}`);
    return partes.join(', ');
  };

  const formatarEnderecoRepresentante = () => {
    if (formData.representante_mesmo_endereco) {
      return formatarEnderecoCompleto();
    }
    const partes = [];
    if (formData.representante_logradouro) partes.push(formData.representante_logradouro);
    if (formData.representante_numero) partes.push(`nº ${formData.representante_numero}`);
    if (formData.representante_complemento) partes.push(formData.representante_complemento);
    if (formData.representante_bairro) partes.push(`Bairro ${formData.representante_bairro}`);
    if (formData.representante_cidade && formData.representante_estado) partes.push(`${formData.representante_cidade}/${formData.representante_estado}`);
    if (formData.representante_cep) partes.push(`CEP ${formData.representante_cep}`);
    return partes.join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      endereco_completo: formatarEnderecoCompleto(),
      representante_endereco_completo: formData.tipo === 'juridica' ? formatarEnderecoRepresentante() : null
    };

    try {
      if (pessoa) {
        await base44.entities.Pessoa.update(pessoa.id, dataToSave);
      } else {
        await base44.entities.Pessoa.create(dataToSave);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      alert('Erro ao salvar pessoa. Tente novamente.');
    }
  };

  const estadoCivilOptions = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' },
    { value: 'uniao_estavel', label: 'União Estável' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">
              {pessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DADOS PESSOA FÍSICA */}
            {formData.tipo === 'fisica' && (
              <>
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900">Dados Pessoais</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf_cnpj}
                        onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        value={formData.rg}
                        onChange={(e) => setFormData({...formData, rg: e.target.value})}
                        placeholder="00.000.000-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estado_civil">Estado Civil</Label>
                      <Select value={formData.estado_civil} onValueChange={(value) => setFormData({...formData, estado_civil: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadoCivilOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input
                        id="profissao"
                        value={formData.profissao}
                        onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                        placeholder="Ex: Engenheiro, Arquiteto..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="naturalidade">Naturalidade</Label>
                      <Input
                        id="naturalidade"
                        value={formData.naturalidade}
                        onChange={(e) => setFormData({...formData, naturalidade: e.target.value})}
                        placeholder="Ex: São Paulo/SP"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* DADOS PESSOA JURÍDICA */}
            {formData.tipo === 'juridica' && (
              <>
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900">Dados da Empresa</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Razão Social *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        placeholder="Razão social da empresa"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                      <Input
                        id="nome_fantasia"
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                        placeholder="Nome fantasia (opcional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                </div>

                {/* Dados do Representante Legal */}
                <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900">Representante Legal</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="representante_nome">Nome Completo *</Label>
                    <Input
                      id="representante_nome"
                      value={formData.representante_nome}
                      onChange={(e) => setFormData({...formData, representante_nome: e.target.value})}
                      placeholder="Nome completo do representante"
                      required={formData.tipo === 'juridica'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="representante_cpf">CPF *</Label>
                      <Input
                        id="representante_cpf"
                        value={formData.representante_cpf}
                        onChange={(e) => setFormData({...formData, representante_cpf: e.target.value})}
                        placeholder="000.000.000-00"
                        required={formData.tipo === 'juridica'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representante_rg">RG</Label>
                      <Input
                        id="representante_rg"
                        value={formData.representante_rg}
                        onChange={(e) => setFormData({...formData, representante_rg: e.target.value})}
                        placeholder="00.000.000-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representante_data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="representante_data_nascimento"
                        type="date"
                        value={formData.representante_data_nascimento}
                        onChange={(e) => setFormData({...formData, representante_data_nascimento: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="representante_estado_civil">Estado Civil</Label>
                      <Select value={formData.representante_estado_civil} onValueChange={(value) => setFormData({...formData, representante_estado_civil: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadoCivilOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representante_profissao">Profissão</Label>
                      <Input
                        id="representante_profissao"
                        value={formData.representante_profissao}
                        onChange={(e) => setFormData({...formData, representante_profissao: e.target.value})}
                        placeholder="Ex: Empresário"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representante_naturalidade">Naturalidade</Label>
                      <Input
                        id="representante_naturalidade"
                        value={formData.representante_naturalidade}
                        onChange={(e) => setFormData({...formData, representante_naturalidade: e.target.value})}
                        placeholder="Ex: cidade de São Paulo/SP"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ENDEREÇO PRINCIPAL */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900">
                {formData.tipo === 'fisica' ? 'Endereço Residencial' : 'Endereço da Empresa'}
              </h3>
              
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => buscarCep(formData.cep)}
                    disabled={buscandoCep}
                    variant="outline"
                  >
                    {buscandoCep ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar CEP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                    placeholder="Rua, Avenida..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                    placeholder="Apto, Bloco..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Cidade"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {/* ENDEREÇO DO REPRESENTANTE (apenas PJ) */}
            {formData.tipo === 'juridica' && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Endereço do Representante</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mesmo_endereco"
                      checked={formData.representante_mesmo_endereco}
                      onCheckedChange={(checked) => setFormData({...formData, representante_mesmo_endereco: checked})}
                    />
                    <label htmlFor="mesmo_endereco" className="text-sm cursor-pointer">
                      Mesmo endereço da empresa
                    </label>
                  </div>
                </div>

                {!formData.representante_mesmo_endereco && (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="representante_cep">CEP</Label>
                        <Input
                          id="representante_cep"
                          value={formData.representante_cep}
                          onChange={(e) => setFormData({...formData, representante_cep: e.target.value})}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => buscarCep(formData.representante_cep, true)}
                          disabled={buscandoCepRepresentante}
                          variant="outline"
                        >
                          {buscandoCepRepresentante ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Buscar CEP
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-2">
                        <Label htmlFor="representante_logradouro">Logradouro</Label>
                        <Input
                          id="representante_logradouro"
                          value={formData.representante_logradouro}
                          onChange={(e) => setFormData({...formData, representante_logradouro: e.target.value})}
                          placeholder="Rua, Avenida..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_numero">Número</Label>
                        <Input
                          id="representante_numero"
                          value={formData.representante_numero}
                          onChange={(e) => setFormData({...formData, representante_numero: e.target.value})}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="representante_complemento">Complemento</Label>
                        <Input
                          id="representante_complemento"
                          value={formData.representante_complemento}
                          onChange={(e) => setFormData({...formData, representante_complemento: e.target.value})}
                          placeholder="Apto, Bloco..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_bairro">Bairro</Label>
                        <Input
                          id="representante_bairro"
                          value={formData.representante_bairro}
                          onChange={(e) => setFormData({...formData, representante_bairro: e.target.value})}
                          placeholder="Bairro"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_cidade">Cidade</Label>
                        <Input
                          id="representante_cidade"
                          value={formData.representante_cidade}
                          onChange={(e) => setFormData({...formData, representante_cidade: e.target.value})}
                          placeholder="Cidade"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representante_estado">Estado (UF)</Label>
                      <Input
                        id="representante_estado"
                        value={formData.representante_estado}
                        onChange={(e) => setFormData({...formData, representante_estado: e.target.value})}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* DADOS BANCÁRIOS */}
            <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="font-semibold text-indigo-900">Dados para Pagamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={formData.banco}
                    onChange={(e) => setFormData({...formData, banco: e.target.value})}
                    placeholder="Ex: Caixa Econômica Federal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    value={formData.agencia}
                    onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                    placeholder="0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conta_corrente">Conta Corrente</Label>
                  <Input
                    id="conta_corrente"
                    value={formData.conta_corrente}
                    onChange={(e) => setFormData({...formData, conta_corrente: e.target.value})}
                    placeholder="000000000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    value={formData.pix}
                    onChange={(e) => setFormData({...formData, pix: e.target.value})}
                    placeholder="CPF, CNPJ, email ou telefone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titular_conta">Titular da Conta</Label>
                  <Input
                    id="titular_conta"
                    value={formData.titular_conta}
                    onChange={(e) => setFormData({...formData, titular_conta: e.target.value})}
                    placeholder="Nome do titular"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj_titular">CPF/CNPJ do Titular</Label>
                  <Input
                    id="cpf_cnpj_titular"
                    value={formData.cpf_cnpj_titular}
                    onChange={(e) => setFormData({...formData, cpf_cnpj_titular: e.target.value})}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* CONTATOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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