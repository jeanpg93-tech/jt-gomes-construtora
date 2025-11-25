import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, CheckCircle, Building2 } from "lucide-react";

export default function SolicitarAcesso() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    cargo_funcao: '',
    motivo_acesso: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.SolicitacaoCadastro.create({
        ...formData,
        status: 'pendente'
      });
      setSuccess(true);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert('Erro ao enviar solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Solicitação Enviada!</h2>
            <p className="text-slate-600 mb-6">
              Sua solicitação de acesso foi enviada com sucesso. O administrador receberá sua solicitação e você será notificado por email quando for aprovado.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Enviar Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <CardTitle className="text-2xl">Solicitar Acesso ao Sistema</CardTitle>
              <p className="text-blue-100 text-sm mt-1">Gestão e Controle de Obras</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
            <p className="text-sm text-blue-800">
              <strong>Atenção:</strong> Após enviar sua solicitação, o administrador receberá seus dados e analisará seu pedido. Você receberá um email quando sua solicitação for aprovada ou negada.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => handleChange('nome_completo', e.target.value)}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo_funcao">Cargo/Função</Label>
              <Input
                id="cargo_funcao"
                value={formData.cargo_funcao}
                onChange={(e) => handleChange('cargo_funcao', e.target.value)}
                placeholder="Ex: Engenheiro, Administrador, Assistente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_acesso">Por que você precisa de acesso ao sistema?</Label>
              <Textarea
                id="motivo_acesso"
                value={formData.motivo_acesso}
                onChange={(e) => handleChange('motivo_acesso', e.target.value)}
                placeholder="Descreva brevemente o motivo pelo qual precisa acessar o sistema..."
                rows={4}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading}
            >
              {loading ? (
                <>Enviando...</>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}