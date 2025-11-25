import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConectarWhatsApp() {
  const [loading, setLoading] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateWhatsAppUrl();
  }, []);

  const generateWhatsAppUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gera o URL de conexão do WhatsApp para o agente
      const url = base44.agents.getWhatsAppConnectURL('jt_financeiro');
      setWhatsappUrl(url);
    } catch (err) {
      console.error('Erro ao gerar URL do WhatsApp:', err);
      setError('Não foi possível gerar o link de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Gerando link de conexão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Conectar WhatsApp
        </h1>
        <p className="text-slate-600">
          Conecte-se ao assistente virtual da J&T Gomes Construtora
        </p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-green-600 rounded-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            Assistente WhatsApp
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">
              🤖 O que o assistente pode fazer?
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Registrar pagamentos e gastos das obras</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Registrar receitas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Gerar resumos financeiros</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Criar links de relatórios detalhados</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Duplicar registros anteriores</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">
              📱 Como conectar:
            </h3>
            <ol className="space-y-3 text-slate-700 mb-6">
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                <span>Clique no botão abaixo para abrir o WhatsApp</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                <span>Você será redirecionado para fazer login (se necessário)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                <span>Após o login, será direcionado para o WhatsApp com o assistente</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                <span>Comece a conversar! Digite um número de 1 a 6 para escolher a ação</span>
              </li>
            </ol>

            {whatsappUrl ? (
              <div className="space-y-4">
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
                    size="lg"
                  >
                    <MessageCircle className="w-6 h-6 mr-3" />
                    Conectar ao WhatsApp
                    <ExternalLink className="w-5 h-5 ml-3" />
                  </Button>
                </a>

                <div className="bg-slate-50 rounded-lg p-4 border">
                  <p className="text-sm text-slate-600 mb-2 font-medium">
                    Ou copie e cole este link no navegador:
                  </p>
                  <code className="text-xs bg-white p-3 rounded border block overflow-x-auto text-slate-700">
                    {whatsappUrl}
                  </code>
                </div>
              </div>
            ) : (
              <Button 
                onClick={generateWhatsAppUrl}
                variant="outline"
                className="w-full"
              >
                Tentar Novamente
              </Button>
            )}
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Importante:</strong> Você precisa estar logado na plataforma base44 para conectar ao WhatsApp. 
              Se não estiver logado, será redirecionado para a página de login primeiro.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}