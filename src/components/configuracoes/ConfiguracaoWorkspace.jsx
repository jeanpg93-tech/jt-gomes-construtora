
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Upload, Save, Building2, Trash2 } from 'lucide-react';

export default function ConfiguracaoWorkspace() {
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    construtora_razao_social: '',
    construtora_nome_fantasia: '',
    construtora_cnpj: '',
    construtora_inscricao_estadual: '',
    construtora_inscricao_municipal: '',
    construtora_endereco: '',
    construtora_telefone: '',
    construtora_email: '',
    representante_nome: '',
    representante_cpf: '',
    representante_rg: '',
    representante_nacionalidade: '',
    representante_estado_civil: '',
    representante_profissao: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [initialWorkspaceData, setInitialWorkspaceData] = useState(null);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  useEffect(() => {
    if (initialWorkspaceData) {
      setFormData({
        name: initialWorkspaceData.workspace_name || '',
        logoUrl: initialWorkspaceData.workspace_logo || '',
        construtora_razao_social: initialWorkspaceData.construtora_razao_social || '',
        construtora_nome_fantasia: initialWorkspaceData.construtora_nome_fantasia || '',
        construtora_cnpj: initialWorkspaceData.construtora_cnpj || '',
        construtora_inscricao_estadual: initialWorkspaceData.construtora_inscricao_estadual || '',
        construtora_inscricao_municipal: initialWorkspaceData.construtora_inscricao_municipal || '',
        construtora_endereco: initialWorkspaceData.construtora_endereco || '',
        construtora_telefone: initialWorkspaceData.construtora_telefone || '',
        construtora_email: initialWorkspaceData.construtora_email || '',
        representante_nome: initialWorkspaceData.representante_nome || '',
        representante_cpf: initialWorkspaceData.representante_cpf || '',
        representante_rg: initialWorkspaceData.representante_rg || '',
        representante_nacionalidade: initialWorkspaceData.representante_nacionalidade || '',
        representante_estado_civil: initialWorkspaceData.representante_estado_civil || '',
        representante_profissao: initialWorkspaceData.representante_profissao || ''
      });
    }
  }, [initialWorkspaceData]);

  const loadWorkspaceData = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        setInitialWorkspaceData(user);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buscarDadosCNPJ = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      alert('CNPJ inválido. Digite um CNPJ com 14 dígitos.');
      return;
    }

    setBuscandoCNPJ(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      const data = await response.json();

      if (response.ok && data) {
        setFormData(prev => ({
          ...prev,
          construtora_razao_social: data.razao_social || prev.construtora_razao_social,
          construtora_nome_fantasia: data.nome_fantasia || prev.construtora_nome_fantasia,
          construtora_cnpj: cnpj,
          construtora_endereco: data.logradouro ? 
            `${data.logradouro}, ${data.numero || 's/n'} - ${data.bairro}, ${data.municipio}/${data.uf}, CEP ${data.cep}` : 
            prev.construtora_endereco,
          construtora_telefone: data.ddd_telefone_1 || prev.construtora_telefone,
          construtora_email: data.email || prev.construtora_email
        }));
        
        alert('Dados do CNPJ carregados com sucesso!\n\nNota: A Inscrição Estadual e Municipal não estão disponíveis na API pública e devem ser preenchidas manualmente.');
      } else {
        alert('CNPJ não encontrado ou inválido.');
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      alert('Erro ao buscar dados do CNPJ. Tente novamente.');
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        workspace_name: formData.name || null,
        workspace_logo: formData.logoUrl || null,
        construtora_razao_social: formData.construtora_razao_social || null,
        construtora_nome_fantasia: formData.construtora_nome_fantasia || null,
        construtora_cnpj: formData.construtora_cnpj || null,
        construtora_inscricao_estadual: formData.construtora_inscricao_estadual || null,
        construtora_inscricao_municipal: formData.construtora_inscricao_municipal || null,
        construtora_endereco: formData.construtora_endereco || null,
        construtora_telefone: formData.construtora_telefone || null,
        construtora_email: formData.construtora_email || null,
        representante_nome: formData.representante_nome || null,
        representante_cpf: formData.representante_cpf || null,
        representante_rg: formData.representante_rg || null,
        representante_nacionalidade: formData.representante_nacionalidade || null,
        representante_estado_civil: formData.representante_estado_civil || null,
        representante_profissao: formData.representante_profissao || null
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logoUrl: result.file_url }));
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      alert('Erro ao fazer upload do logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Configurações da Construtora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-4">
          <Label>Logo da Construtora</Label>
          
          {formData.logoUrl && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
              <img 
                src={formData.logoUrl} 
                alt="Logo atual" 
                className="w-12 h-12 rounded-lg object-cover shadow-md"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Logo atual</p>
                <p className="text-xs text-slate-500">Este logo será exibido na aplicação e documentos</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-2">
              {formData.logoUrl ? 'Clique para alterar o logo' : 'Clique para adicionar um logo'}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Formatos aceitos: PNG, JPG, JPEG (max. 5MB)
            </p>
            <input
              type="file"
              id="logo-upload"
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('logo-upload').click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.logoUrl ? 'Alterar Logo' : 'Selecionar Logo'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Nome da Aplicação */}
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Nome da Aplicação</Label>
          <Input
            id="workspace-name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Digite o nome da sua empresa/aplicação"
          />
          <p className="text-sm text-slate-500">
            Este nome aparecerá na barra lateral e no cabeçalho da aplicação.
          </p>
        </div>

        {/* Dados da Empresa */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-slate-800">Informações da Empresa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razao-social">Razão Social</Label>
              <Input
                id="razao-social"
                value={formData.construtora_razao_social}
                onChange={(e) => handleChange('construtora_razao_social', e.target.value)}
                placeholder="Razão social da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
              <Input
                id="nome-fantasia"
                value={formData.construtora_nome_fantasia}
                onChange={(e) => handleChange('construtora_nome_fantasia', e.target.value)}
                placeholder="Nome fantasia"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="construtora_cnpj">CNPJ *</Label>
              <div className="flex gap-2">
                <Input
                  id="construtora_cnpj"
                  value={formData.construtora_cnpj}
                  onChange={(e) => handleChange('construtora_cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
                <Button
                  type="button"
                  onClick={() => buscarDadosCNPJ(formData.construtora_cnpj)}
                  disabled={buscandoCNPJ}
                  variant="outline"
                >
                  {buscandoCNPJ ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    'Buscar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Digite o CNPJ e clique em "Buscar" para preencher automaticamente os dados da empresa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao-estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao-estadual"
                value={formData.construtora_inscricao_estadual}
                onChange={(e) => handleChange('construtora_inscricao_estadual', e.target.value)}
                placeholder="000.000.000.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao-municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao-municipal"
                value={formData.construtora_inscricao_municipal}
                onChange={(e) => handleChange('construtora_inscricao_municipal', e.target.value)}
                placeholder="000000-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Textarea
              id="endereco"
              value={formData.construtora_endereco}
              onChange={(e) => handleChange('construtora_endereco', e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade/estado, CEP"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.construtora_telefone}
                onChange={(e) => handleChange('construtora_telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.construtora_email}
                onChange={(e) => handleChange('construtora_email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Dados do Representante Legal */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-slate-800">Representante Legal</h3>
          
          <div className="space-y-2">
            <Label htmlFor="representante-nome">Nome Completo</Label>
            <Input
              id="representante-nome"
              value={formData.representante_nome}
              onChange={(e) => handleChange('representante_nome', e.target.value)}
              placeholder="Nome completo do representante"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="representante-cpf">CPF</Label>
              <Input
                id="representante-cpf"
                value={formData.representante_cpf}
                onChange={(e) => handleChange('representante_cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante-rg">RG</Label>
              <Input
                id="representante-rg"
                value={formData.representante_rg}
                onChange={(e) => handleChange('representante_rg', e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante-nacionalidade">Nacionalidade</Label>
              <Input
                id="representante-nacionalidade"
                value={formData.representante_nacionalidade}
                onChange={(e) => handleChange('representante_nacionalidade', e.target.value)}
                placeholder="brasileiro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="representante-estado-civil">Estado Civil</Label>
              <Input
                id="representante-estado-civil"
                value={formData.representante_estado_civil}
                onChange={(e) => handleChange('representante_estado_civil', e.target.value)}
                placeholder="casado, solteiro, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante-profissao">Profissão</Label>
              <Input
                id="representante-profissao"
                value={formData.representante_profissao}
                onChange={(e) => handleChange('representante_profissao', e.target.value)}
                placeholder="empresário, engenheiro, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
