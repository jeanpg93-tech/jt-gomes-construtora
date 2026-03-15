import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, CheckCircle, Key, Bot, Code, FileText } from "lucide-react";

const API_KEY = "J&T_GOMES_CONSTRUTORA_API";

const NOTA_API = `Você é um assistente especializado em gestão de obras da J&T Gomes Construtora.

Esta API permite acessar e gerenciar dados do sistema de obras. Use-a para consultar, criar e atualizar registros.

## Endpoint
A URL da função está disponível no painel Base44 em: Dashboard → Code → Functions → manusAIApi

## Autenticação
Envie a chave no header: x-api-secret
Ou no campo "secret" do body JSON.

## Estrutura da Requisição (POST, body JSON)
{
  "secret": "<API_KEY>",
  "entityName": "<nome da entidade>",
  "operation": "<operação>",
  "payload": { ... }
}

## Entidades disponíveis
Obra, Gasto, Receita, Fornecedor, GastoAdministrativo, CategoriaGasto, CategoriaReceita, SubcategoriaGasto, SubcategoriaGasto2, EtapaObra, Contrato, Recibo, Pessoa

## Operações suportadas
- list: listar registros (payload: { limit, sort, skip })
- get: buscar por ID (payload: { id })
- create: criar registro (payload: { data: {...} })
- update: atualizar (payload: { id, data: {...} })
- delete: deletar (payload: { id })
- filter: filtrar com query (payload: { query: {...}, sort, limit })
- bulkCreate: criar vários (payload: { data: [...] })

## Exemplo
POST <URL_DA_FUNCAO>
Body: { "secret": "<API_KEY>", "entityName": "Obra", "operation": "list", "payload": { "limit": 10 } }`;

const FIELDS = [
  {
    label: "Nome",
    value: "J&T Gomes Construtora API",
    desc: "Nome para identificar a API no Manus IA"
  },
  {
    label: "Nota (documentação)",
    value: NOTA_API,
    desc: "Cole no campo 'Nota' — instrui o Manus sobre como usar a API",
    multiline: true
  },
  {
    label: "Nome do Segredo",
    value: "API_SECRET",
    desc: "Preencha em 'Nome do segredo' dentro de Segredos (Variáveis de Ambiente)"
  },
  {
    label: "Valor do Segredo",
    value: API_KEY,
    desc: "Preencha em 'Valor' dentro de Segredos (Variáveis de Ambiente)",
    sensitive: true
  },
];

function CopyField({ field }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(field.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{field.label}</p>
        <p className="text-xs text-slate-400">{field.desc}</p>
      </div>
      <div className="flex items-start gap-2">
        {field.multiline ? (
          <textarea
            readOnly
            value={field.value}
            rows={5}
            className="flex-1 font-mono text-xs bg-slate-900 text-green-400 rounded-lg p-3 resize-none border-0 outline-none w-full"
          />
        ) : (
          <Input
            type={field.sensitive && !show ? "password" : "text"}
            value={field.value}
            readOnly
            className="font-mono text-sm bg-white"
          />
        )}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {field.sensitive && (
            <Button variant="outline" size="icon" onClick={() => setShow(!show)}>
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
          <Button
            onClick={handleCopy}
            size={field.multiline ? "sm" : "icon"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ManusAPIKey() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-600" />
          Integração com Manus IA
        </h1>
        <p className="text-slate-500 mt-1">Copie os campos abaixo e preencha no formulário "Adicionar API personalizada" do Manus IA.</p>
      </div>

      {/* Passo a passo */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Como configurar no Manus IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>No Manus IA, abra <strong>"Adicionar API personalizada"</strong></li>
            <li>Preencha o campo <strong>Nome</strong> com o valor abaixo</li>
            <li>Cole a <strong>Nota</strong> com toda a documentação</li>
            <li>Em <strong>Segredos</strong>, adicione o nome e valor do segredo</li>
            <li>Salve e pronto — o Manus saberá como usar a API!</li>
          </ol>
        </CardContent>
      </Card>

      {/* URL do Endpoint */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-600" />
            URL do Endpoint (obtenha no painel Base44)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Acesse: <strong>Dashboard → Code → Functions → manusAIApi</strong> e copie a URL exibida na página da função.
          </div>
        </CardContent>
      </Card>

      {/* Campos para copiar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-600" />
            Campos para preencher no Manus IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {FIELDS.map(field => (
            <CopyField key={field.label} field={field} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}