import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, CheckCircle, Key, Bot, Info, Code } from "lucide-react";

const API_KEY = "J&T_GOMES_CONSTRUTORA_API";

const ENTIDADES = [
  "Obra", "Gasto", "Receita", "Fornecedor", "GastoAdministrativo",
  "CategoriaGasto", "CategoriaReceita", "SubcategoriaGasto", "SubcategoriaGasto2",
  "EtapaObra", "Contrato", "Recibo", "Pessoa"
];

const OPERACOES = [
  { nome: "list", desc: "Listar registros" },
  { nome: "get", desc: "Buscar por ID" },
  { nome: "create", desc: "Criar registro" },
  { nome: "update", desc: "Atualizar registro" },
  { nome: "delete", desc: "Deletar registro" },
  { nome: "filter", desc: "Filtrar com query" },
  { nome: "bulkCreate", desc: "Criar vários de uma vez" },
];

export default function ManusAPIKey() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const examplePayload = JSON.stringify({
    secret: API_KEY,
    entityName: "Obra",
    operation: "list",
    payload: { limit: 10 }
  }, null, 2);

  const handleCopyExample = () => {
    navigator.clipboard.writeText(examplePayload);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-600" />
          API do Manus IA
        </h1>
        <p className="text-slate-500 mt-1">Configure a integração do Manus IA com o sistema J&T Gomes Construtora.</p>
      </div>

      {/* API Key Card */}
      <Card className="border-2 border-blue-100 bg-blue-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <Key className="w-4 h-4" />
            Chave de Autenticação (API Key)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={API_KEY}
              readOnly
              className="font-mono bg-white text-slate-800 border-blue-200"
            />
            <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} className="flex-shrink-0">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleCopyKey}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-blue-700 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Envie esta chave no header <code className="bg-blue-100 px-1 rounded">x-api-secret</code> ou no campo <code className="bg-blue-100 px-1 rounded">secret</code> do body da requisição.
          </p>
        </CardContent>
      </Card>

      {/* Endpoint Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-600" />
            Endpoint da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-600">Para obter a URL do endpoint, acesse:</p>
          <div className="bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-700">
            Dashboard → Code → Functions → <span className="text-blue-600 font-bold">manusAIApi</span>
          </div>
          <p className="text-xs text-slate-500">A URL estará listada na página da função no painel administrativo do Base44.</p>
        </CardContent>
      </Card>

      {/* Entidades disponíveis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entidades Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ENTIDADES.map(e => (
              <Badge key={e} variant="secondary" className="font-mono text-xs">{e}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operações disponíveis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operações Suportadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPERACOES.map(op => (
              <div key={op.nome} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Badge variant="outline" className="font-mono text-xs flex-shrink-0">{op.nome}</Badge>
                <span className="text-sm text-slate-600">{op.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exemplo de uso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Exemplo de Requisição (Body JSON)</span>
            <Button variant="outline" size="sm" onClick={handleCopyExample}>
              {copiedExample ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copiedExample ? "Copiado!" : "Copiar"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-auto">
            {examplePayload}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}