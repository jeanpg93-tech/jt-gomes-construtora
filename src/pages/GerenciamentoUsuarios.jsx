
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // New import
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // New import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, X, Shield, UserPlus, ArrowRight, CheckCircle, XCircle, Clock, Mail } from "lucide-react"; // New imports
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // New imports
import { format } from "date-fns"; // New import
import { ptBR } from "date-fns/locale"; // New import

export default function GerenciamentoUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]); // New state
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [approvingSolicitacao, setApprovingSolicitacao] = useState(null); // New state
  const [denyingId, setDenyingId] = useState(null); // New state
  const [motivoNegacao, setMotivoNegacao] = useState(''); // New state

  const [formData, setFormData] = useState({
    permissoes_obras: 'leitura',
    permissoes_gastos: 'leitura',
    permissoes_receitas: 'leitura',
    permissoes_relatorios: 'leitura',
    permissoes_fornecedores: 'leitura',
    permissoes_contratos: 'leitura',
    permissoes_configuracoes: 'nenhuma'
  });

  const [permissoesAprovacao, setPermissoesAprovacao] = useState({ // New state
    permissoes_obras: 'leitura',
    permissoes_gastos: 'leitura',
    permissoes_receitas: 'leitura',
    permissoes_relatorios: 'leitura',
    permissoes_fornecedores: 'leitura',
    permissoes_contratos: 'leitura',
    permissoes_configuracoes: 'nenhuma'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, usersList, solicitacoesList] = await Promise.all([ // Modified
        base44.auth.me(),
        base44.entities.User.list(),
        base44.entities.SolicitacaoCadastro.list('-created_date') // New fetch
      ]);
      setCurrentUser(user);
      setUsuarios(usersList);
      setSolicitacoes(solicitacoesList); // Set new state
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      permissoes_obras: user.permissoes_obras || 'leitura',
      permissoes_gastos: user.permissoes_gastos || 'leitura',
      permissoes_receitas: user.permissoes_receitas || 'leitura',
      permissoes_relatorios: user.permissoes_relatorios || 'leitura',
      permissoes_fornecedores: user.permissoes_fornecedores || 'leitura',
      permissoes_contratos: user.permissoes_contratos || 'leitura',
      permissoes_configuracoes: user.permissoes_configuracoes || 'nenhuma'
    });
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;

    try {
      await base44.entities.User.update(editingUser.id, formData);
      setEditingUser(null);
      await loadData();
      alert('Permissões atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões.');
    }
  };

  const handleAprovarSolicitacao = async (solicitacao) => { // New function
    try {
      // Atualizar a solicitação com status aprovado e permissões
      await base44.entities.SolicitacaoCadastro.update(solicitacao.id, {
        status: 'aprovado',
        data_aprovacao: new Date().toISOString().split('T')[0],
        aprovado_por: currentUser.email,
        ...permissoesAprovacao
      });

      // Enviar email para o usuário informando que foi aprovado
      try {
        await base44.integrations.Core.SendEmail({
          to: solicitacao.email,
          subject: 'Acesso Aprovado - Sistema de Gestão de Obras',
          body: `Olá ${solicitacao.nome_completo},\n\nSua solicitação de acesso ao sistema foi aprovada!\n\nAgora você precisa criar sua conta. Por favor, acesse o link abaixo e clique em "Sign Up" para criar sua conta usando o email: ${solicitacao.email}\n\nhttps://app.base44.com/dashboard\n\nApós criar sua conta, você já poderá acessar o sistema com as permissões definidas.\n\nSe tiver dúvidas, entre em contato com o administrador.\n\nAtenciosamente,\nEquipe de Gestão de Obras`
        });
      } catch (emailError) {
        console.error('Erro ao enviar email de aprovação:', emailError);
      }

      setApprovingSolicitacao(null);
      // Resetar permissões de aprovação para o próximo uso
      setPermissoesAprovacao({
        permissoes_obras: 'leitura',
        permissoes_gastos: 'leitura',
        permissoes_receitas: 'leitura',
        permissoes_relatorios: 'leitura',
        permissoes_fornecedores: 'leitura',
        permissoes_contratos: 'leitura',
        permissoes_configuracoes: 'nenhuma'
      });
      
      await loadData();
      alert(`Solicitação aprovada! Um email foi enviado para ${solicitacao.email} com instruções para criar a conta.`);
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      alert('Erro ao aprovar solicitação.');
    }
  };

  const handleNegarSolicitacao = async (solicitacaoId) => { // New function
    if (!motivoNegacao.trim()) {
      alert('Por favor, informe o motivo da negação.');
      return;
    }

    try {
      const solicitacao = solicitacoes.find(s => s.id === solicitacaoId);
      if (!solicitacao) {
          console.error('Solicitação não encontrada para negação:', solicitacaoId);
          alert('Erro: Solicitação não encontrada.');
          return;
      }
      
      await base44.entities.SolicitacaoCadastro.update(solicitacaoId, {
        status: 'negado',
        data_aprovacao: new Date().toISOString().split('T')[0], // Using data_aprovacao field for denial date too.
        aprovado_por: currentUser.email,
        motivo_negacao: motivoNegacao
      });

      // Enviar email informando a negação
      try {
        await base44.integrations.Core.SendEmail({
          to: solicitacao.email,
          subject: 'Solicitação de Acesso - Sistema de Gestão de Obras',
          body: `Olá ${solicitacao.nome_completo},\n\nInfelizmente sua solicitação de acesso ao sistema não foi aprovada.\n\nMotivo: ${motivoNegacao}\n\nSe tiver dúvidas, entre em contato com o administrador.\n\nAtenciosamente,\nEquipe de Gestão de Obras`
        });
      } catch (emailError) {
        console.error('Erro ao enviar email de negação:', emailError);
      }

      setDenyingId(null);
      setMotivoNegacao('');
      await loadData();
      alert('Solicitação negada e usuário notificado por email.');
    } catch (error) {
      console.error('Erro ao negar solicitação:', error);
      alert('Erro ao negar solicitação.');
    }
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      nenhuma: 'Nenhuma',
      leitura: 'Leitura',
      leitura_ocultar_valores: 'Leitura (sem valores)',
      edicao: 'Edição',
      total: 'Total'
    };
    return labels[permission] || permission;
  };

  const getPermissionColor = (permission) => {
    const colors = {
      nenhuma: 'bg-gray-100 text-gray-800',
      leitura: 'bg-blue-100 text-blue-800',
      leitura_ocultar_valores: 'bg-cyan-100 text-cyan-800',
      edicao: 'bg-yellow-100 text-yellow-800',
      total: 'bg-green-100 text-green-800'
    };
    return colors[permission] || 'bg-gray-100 text-gray-800';
  };

  const abrirDashboard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = 'https://app.base44.com/dashboard';
    
    // Tentar abrir em nova aba
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        newWindow.focus();
      } else {
        // Se bloqueado, tentar abrir na mesma janela
        alert('Por favor, permita pop-ups para este site. Você será redirecionado agora.');
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao abrir dashboard:', error);
      // Fallback: abrir na mesma janela
      window.location.href = url;
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-red-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Acesso Negado</h3>
          <p className="text-slate-500">Apenas administradores podem acessar esta página.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente');
  const solicitacoesAprovadas = solicitacoes.filter(s => s.status === 'aprovado');
  const solicitacoesNegadas = solicitacoes.filter(s => s.status === 'negado');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-slate-600">Gerencie solicitações e permissões dos usuários</p>
        </div>
      </div>

      <Tabs defaultValue="solicitacoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="solicitacoes" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Solicitações
            {solicitacoesPendentes.length > 0 && (
              <Badge className="bg-red-500 text-white ml-2">
                {solicitacoesPendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários Ativos
          </TabsTrigger>
        </TabsList>

        {/* ABA DE SOLICITAÇÕES */}
        <TabsContent value="solicitacoes" className="space-y-6">
          {/* Link de Cadastro */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Link para Novos Usuários</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Compartilhe este link com pessoas que precisam de acesso ao sistema:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/solicitar-acesso`}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/solicitar-acesso`);
                        alert('Link copiado!');
                      }}
                      variant="outline"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solicitações Pendentes */}
          {solicitacoesPendentes.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Solicitações Pendentes ({solicitacoesPendentes.length})
              </h2>
              {solicitacoesPendentes.map((solicitacao) => (
                <Card key={solicitacao.id} className="border-l-4 border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{solicitacao.nome_completo}</h3>
                        <p className="text-sm text-slate-600">{solicitacao.email}</p>
                        {solicitacao.telefone && (
                          <p className="text-sm text-slate-600">{solicitacao.telefone}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Solicitado em {format(new Date(solicitacao.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
                    </div>

                    {solicitacao.cargo_funcao && (
                      <div className="mb-3">
                        <Label className="text-xs text-slate-500">Cargo/Função</Label>
                        <p className="text-sm">{solicitacao.cargo_funcao}</p>
                      </div>
                    )}

                    {solicitacao.motivo_acesso && (
                      <div className="mb-4">
                        <Label className="text-xs text-slate-500">Motivo do Acesso</Label>
                        <p className="text-sm">{solicitacao.motivo_acesso}</p>
                      </div>
                    )}

                    {approvingSolicitacao?.id === solicitacao.id ? (
                      <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900">Definir Permissões</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Obras</Label>
                            <Select value={permissoesAprovacao.permissoes_obras} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_obras: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Gastos</Label>
                            <Select value={permissoesAprovacao.permissoes_gastos} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_gastos: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Receitas</Label>
                            <Select value={permissoesAprovacao.permissoes_receitas} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_receitas: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Relatórios</Label>
                            <Select value={permissoesAprovacao.permissoes_relatorios} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_relatorios: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="leitura_ocultar_valores">Leitura (sem valores)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Fornecedores</Label>
                            <Select value={permissoesAprovacao.permissoes_fornecedores} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_fornecedores: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Contratos</Label>
                            <Select value={permissoesAprovacao.permissoes_contratos} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_contratos: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Configurações</Label>
                            <Select value={permissoesAprovacao.permissoes_configuracoes} onValueChange={(v) => setPermissoesAprovacao({...permissoesAprovacao, permissoes_configuracoes: v})}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => handleAprovarSolicitacao(solicitacao)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Aprovação
                          </Button>
                          <Button 
                            onClick={() => setApprovingSolicitacao(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : denyingId === solicitacao.id ? (
                      <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
                        <Label htmlFor="motivoNegacao" className="text-sm">Motivo da Negação</Label>
                        <Textarea
                          id="motivoNegacao"
                          value={motivoNegacao}
                          onChange={(e) => setMotivoNegacao(e.target.value)}
                          placeholder="Explique o motivo da negação..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleNegarSolicitacao(solicitacao.id)}
                            className="bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Confirmar Negação
                          </Button>
                          <Button 
                            onClick={() => {
                              setDenyingId(null);
                              setMotivoNegacao('');
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setApprovingSolicitacao(solicitacao);
                            // Initialize permissions with defaults for approval
                            setPermissoesAprovacao({
                                permissoes_obras: 'leitura',
                                permissoes_gastos: 'leitura',
                                permissoes_receitas: 'leitura',
                                permissoes_relatorios: 'leitura',
                                permissoes_fornecedores: 'leitura',
                                permissoes_contratos: 'leitura',
                                permissoes_configuracoes: 'nenhuma'
                            });
                          }}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          onClick={() => setDenyingId(solicitacao.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Negar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700">Nenhuma Solicitação Pendente</h3>
                <p className="text-slate-500">As novas solicitações aparecerão aqui.</p>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          {(solicitacoesAprovadas.length > 0 || solicitacoesNegadas.length > 0) && (
            <div className="space-y-4 mt-6">
              <h2 className="text-xl font-bold text-slate-800">Histórico de Solicitações</h2>
              {solicitacoesAprovadas.concat(solicitacoesNegadas).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((solicitacao) => (
                <Card key={solicitacao.id} className={`border-l-4 ${solicitacao.status === 'aprovado' ? 'border-green-500' : 'border-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{solicitacao.nome_completo}</h3>
                        <p className="text-sm text-slate-600">{solicitacao.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {solicitacao.status === 'aprovado' ? 'Aprovado' : 'Negado'} em {format(new Date(solicitacao.data_aprovacao), "dd/MM/yyyy", { locale: ptBR })} por {solicitacao.aprovado_por}
                        </p>
                        {solicitacao.motivo_negacao && (
                          <p className="text-xs text-red-600 mt-1">Motivo: {solicitacao.motivo_negacao}</p>
                        )}
                      </div>
                      <Badge className={solicitacao.status === 'aprovado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {solicitacao.status === 'aprovado' ? 'Aprovado' : 'Negado'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA DE USUÁRIOS ATIVOS */}
        <TabsContent value="usuarios">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Usuários Cadastrados ({usuarios.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {usuarios.map((user) => {
                const isCurrentUser = user.id === currentUser.id;
                const isEditing = editingUser?.id === user.id;

                return (
                  <Card key={user.id} className={`shadow-lg border-0 ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-800">
                              {user.full_name}
                              {isCurrentUser && <span className="text-sm text-blue-600 ml-2">(Você)</span>}
                            </CardTitle>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                          <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </div>
                        {!isCurrentUser && (
                          <div>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSavePermissions}>
                                  <Save className="w-4 h-4 mr-2" />
                                  Salvar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                                Editar Permissões
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Obras</Label>
                            <Select value={formData.permissoes_obras} onValueChange={(v) => setFormData({...formData, permissoes_obras: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Gastos</Label>
                            <Select value={formData.permissoes_gastos} onValueChange={(v) => setFormData({...formData, permissoes_gastos: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Receitas</Label>
                            <Select value={formData.permissoes_receitas} onValueChange={(v) => setFormData({...formData, permissoes_receitas: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Relatórios</Label>
                            <Select value={formData.permissoes_relatorios} onValueChange={(v) => setFormData({...formData, permissoes_relatorios: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="leitura_ocultar_valores">Leitura (sem valores)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Fornecedores</Label>
                            <Select value={formData.permissoes_fornecedores} onValueChange={(v) => setFormData({...formData, permissoes_fornecedores: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Contratos</Label>
                            <Select value={formData.permissoes_contratos} onValueChange={(v) => setFormData({...formData, permissoes_contratos: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Configurações</Label>
                            <Select value={formData.permissoes_configuracoes} onValueChange={(v) => setFormData({...formData, permissoes_configuracoes: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                                <SelectItem value="leitura">Leitura</SelectItem>
                                <SelectItem value="edicao">Edição</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Obras</p>
                            <Badge className={getPermissionColor(user.permissoes_obras || 'leitura')}>
                              {getPermissionLabel(user.permissoes_obras || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Gastos</p>
                            <Badge className={getPermissionColor(user.permissoes_gastos || 'leitura')}>
                              {getPermissionLabel(user.permissoes_gastos || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Receitas</p>
                            <Badge className={getPermissionColor(user.permissoes_receitas || 'leitura')}>
                              {getPermissionLabel(user.permissoes_receitas || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Relatórios</p>
                            <Badge className={getPermissionColor(user.permissoes_relatorios || 'leitura')}>
                              {getPermissionLabel(user.permissoes_relatorios || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Fornecedores</p>
                            <Badge className={getPermissionColor(user.permissoes_fornecedores || 'leitura')}>
                              {getPermissionLabel(user.permissoes_fornecedores || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Contratos</p>
                            <Badge className={getPermissionColor(user.permissoes_contratos || 'leitura')}>
                              {getPermissionLabel(user.permissoes_contratos || 'leitura')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Configurações</p>
                            <Badge className={getPermissionColor(user.permissoes_configuracoes || 'nenhuma')}>
                              {getPermissionLabel(user.permissoes_configuracoes || 'nenhuma')}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
