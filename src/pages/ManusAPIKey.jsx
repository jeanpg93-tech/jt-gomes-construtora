import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff, CheckCircle, Key, Bot, Code, FileText } from "lucide-react";

const API_KEY = "J&T_GOMES_CONSTRUTORA_API";

const NOTA_API = `Você é um assistente especializado em gestão de obras da J&T Gomes Construtora.

Esta API permite acessar e gerenciar dados do sistema de obras. Use-a para consultar, criar e atualizar registros.

## Endpoint
A URL da função está disponível no painel Base44 em: Dashboard → Code → Functions → manusAIApi

## Autenticação
Envie a chave em um dos formatos:
- Header: x-api-key, x-api-secret, ou Authorization: Bearer <chave>
- Body JSON: { "secret": "<chave>" }

## Formato da Requisição (POST, body JSON)
{
  "secret": "<API_KEY>",
  "endpoint": "<endpoint>",
  "payload": { ... }
}

## CRUD Genérico
Também aceita este formato:
{
  "secret": "<API_KEY>",
  "entityName": "Compra",
  "operation": "create",
  "data": {
    "descricao": "20 kg Rejunte",
    "valor": 65,
    "data": "2026-04-02",
    "obra_id": "...",
    "categoria_id": "..."
  }
}

Observações importantes:
- entityName "Compra" é tratado como entidade "Gasto"
- Para create/update, a API aceita tanto "data" na raiz quanto payload.data
- Campos de data aceitam "YYYY-MM-DD" e também ISO 8601; a API converte automaticamente para YYYY-MM-DD

## Endpoints Semânticos Disponíveis

### OBRAS
- endpoint: "/obras" — listar obras ativas

### BOLETOS / CONTAS A PAGAR
- endpoint: "/boletos" — listar boletos/gastos com vencimento
  payload: { status, obra_id, vencimento_de, vencimento_ate, limit, incluir_recorrencia }
- endpoint: "/boletos/id" — detalhes de um boleto
  payload: { id }
- endpoint: "/boletos/criar" — criar novo boleto
  payload: { descricao, valor, data, data_vencimento|vencimento, obra_id, categoria_id, fornecedor_id, forma_pagamento, status_pagamento, eh_recorrente, valor_total_recorrencia, valor_entrada, data_entrada, quantidade_parcelas }
- endpoint: "/boletos/pagar" — marcar boleto como pago
  payload: { id, data_pagamento, forma_pagamento }
- endpoint: "/boletos/deletar" — remover boleto
  payload: { id }

### COMPRAS / DESPESAS
- endpoint: "/compras" — listar compras/despesas
  payload: { obra_id, categoria_id, limit, incluir_recorrencia }
- endpoint: "/compras/criar" — registrar nova compra
  payload: { descricao, valor, data, data_vencimento, data_pagamento, obra_id, categoria_id, fornecedor_id, subcategoria_id, etapa_obra_ids, forma_pagamento, status_pagamento, observacoes, eh_recorrente, valor_total_recorrencia, valor_entrada, data_entrada, quantidade_parcelas }

### PARCELAS DE GASTOS RECORRENTES
- endpoint: "/parcelas" — listar parcelas
  payload: { gasto_id, status, vencimento_de, vencimento_ate, limit }
- endpoint: "/parcelas/criar" — criar parcela
  payload: { gasto_id, numero_parcela, descricao, valor, data_vencimento, data_pagamento, status }
- endpoint: "/parcelas/pagar" — marcar parcela como paga
  payload: { id, data_pagamento }

## Resposta com recorrência
Quando incluir_recorrencia=true, os gastos recorrentes retornam com:
- parcelas: lista de parcelas vinculadas
- recorrencia_resumo: total_parcelas, parcelas_pagas, parcelas_pendentes, valor_entrada, valor_pago_parcelas, valor_pago_total, valor_pendente_parcelas, proxima_parcela

## Entidades disponíveis no CRUD
Obra, Gasto, Compra, ParcelaGasto, Receita, Fornecedor, GastoAdministrativo, CategoriaGasto, CategoriaReceita, SubcategoriaGasto, SubcategoriaGasto2, EtapaObra, Contrato, Recibo, Pessoa

## Operações disponíveis
list, get, create, bulkCreate, update, delete, filter, listAll, count

## Formato de Resposta
{ "success": true, "data": [...], "message": "..." }`;

const FIELDS = [
  {
    label: "Nome",
    value: "J&T Gomes Construtora API",
    desc: "Nome para identificar a API no Abacus IA"
  },
  {
    label: "Nota (documentação)",
    value: NOTA_API,
    desc: "Cole no campo 'Nota' — instrui o Abacus sobre como usar a API",
    multiline: true
  },
  {
    label: "Chave de Acesso (API Key)",
    value: API_KEY,
    desc: "Use no header x-api-key ou no body como \"secret\"",
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
          Integração com Abacus IA
        </h1>
        <p className="text-slate-500 mt-1">Copie os campos abaixo e configure no Abacus IA.</p>
      </div>

      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Como configurar no Abacus IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>No Abacus IA, vá em <strong>"Add Custom API"</strong> ou <strong>"Integrations"</strong></li>
            <li>Cole a <strong>URL do endpoint</strong> da função</li>
            <li>Configure a autenticação com o <strong>header x-api-key</strong> ou envie <code>"secret"</code> no body</li>
            <li>Use o <strong>valor do segredo</strong> abaixo como chave</li>
            <li>Salve e teste com o endpoint <code>/obras</code> ou <code>/compras</code></li>
          </ol>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-600" />
            Campos para configurar no Abacus IA
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