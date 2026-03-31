import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_SECRET = "J&T_GOMES_CONSTRUTORA_API";

function checkAuth(req, body) {
    const provided = req.headers.get("x-api-secret") 
        || req.headers.get("x-api-key")
        || (req.headers.get("authorization") || "").replace("Bearer ", "")
        || body?.secret;
    return provided === API_SECRET;
}

function ok(data, message = "OK") {
    return Response.json({ success: true, data, message });
}

function err(message, status = 400) {
    return Response.json({ success: false, error: message }, { status });
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => ({}));

        if (!checkAuth(req, body)) {
            return err("Unauthorized: Invalid API Key", 401);
        }

        const entities = base44.asServiceRole.entities;
        const { endpoint, operation, entityName, payload } = body;

        // ─── SEMANTIC ENDPOINTS ───────────────────────────────────────────────

        // GET /obras — listar obras ativas
        if (endpoint === "/obras" || endpoint === "obras") {
            const obras = await entities.Obra.filter({ ativa: true }, '-created_date', 100);
            return ok(obras, `${obras.length} obras encontradas`);
        }

        // GET /boletos — listar boletos (contas a pagar = Gastos)
        if (endpoint === "/boletos" || endpoint === "boletos") {
            const { status, vencimento_ate, vencimento_de, obra_id, limit = 100 } = payload || {};
            let query = {};
            if (status) query.status_pagamento = status;
            if (obra_id) query.obra_id = obra_id;

            let gastos = await entities.Gasto.filter(query, 'data_vencimento', limit);

            // Filtros de data de vencimento
            if (vencimento_de) gastos = gastos.filter(g => g.data_vencimento >= vencimento_de);
            if (vencimento_ate) gastos = gastos.filter(g => g.data_vencimento <= vencimento_ate);

            // Vencidos: pendentes com vencimento anterior a hoje
            if (status === "vencidos") {
                const hoje = new Date().toISOString().split('T')[0];
                gastos = await entities.Gasto.filter({ status_pagamento: "pendente" }, 'data_vencimento', limit);
                gastos = gastos.filter(g => g.data_vencimento && g.data_vencimento < hoje);
            }

            return ok(gastos, `${gastos.length} boletos encontrados`);
        }

        // GET /boletos/:id — detalhes de um boleto
        if (endpoint === "/boletos/id" || endpoint === "boletos/id") {
            if (!payload?.id) return err("id é obrigatório");
            const boleto = await entities.Gasto.get(payload.id);
            return ok(boleto);
        }

        // POST /boletos — criar boleto (Gasto com vencimento)
        if (endpoint === "/boletos/criar" || endpoint === "boletos/criar") {
            const { descricao, valor, vencimento, fornecedor_id, categoria_id, obra_id } = payload || {};
            if (!descricao || !valor || !obra_id || !categoria_id) {
                return err("descricao, valor, obra_id e categoria_id são obrigatórios");
            }
            const boleto = await entities.Gasto.create({
                descricao,
                valor: parseFloat(valor),
                data: new Date().toISOString().split('T')[0],
                data_vencimento: vencimento,
                fornecedor_id,
                categoria_id,
                obra_id,
                status_pagamento: "pendente"
            });
            return ok(boleto, "Boleto criado com sucesso");
        }

        // PUT /boletos/:id/pagar — dar baixa no boleto
        if (endpoint === "/boletos/pagar" || endpoint === "boletos/pagar") {
            if (!payload?.id) return err("id é obrigatório");
            const hoje = new Date().toISOString().split('T')[0];
            const atualizado = await entities.Gasto.update(payload.id, {
                status_pagamento: "pago",
                data_pagamento: payload.data_pagamento || hoje,
                forma_pagamento: payload.forma_pagamento
            });
            return ok(atualizado, "Boleto marcado como pago");
        }

        // DELETE /boletos/:id — remover boleto
        if (endpoint === "/boletos/deletar" || endpoint === "boletos/deletar") {
            if (!payload?.id) return err("id é obrigatório");
            await entities.Gasto.delete(payload.id);
            return ok({ id: payload.id }, "Boleto removido com sucesso");
        }

        // GET /compras — listar compras/despesas
        if (endpoint === "/compras" || endpoint === "compras") {
            const { obra_id, categoria_id, limit = 100 } = payload || {};
            let query = {};
            if (obra_id) query.obra_id = obra_id;
            if (categoria_id) query.categoria_id = categoria_id;
            const compras = await entities.Gasto.filter(query, '-data', limit);
            return ok(compras, `${compras.length} compras encontradas`);
        }

        // POST /compras — registrar nova compra/despesa
        if (endpoint === "/compras/criar" || endpoint === "compras/criar") {
            const { descricao, valor, data, fornecedor_id, obra_id, categoria_id, subcategoria_id, etapa_obra_ids } = payload || {};
            if (!descricao || !valor || !obra_id || !categoria_id) {
                return err("descricao, valor, obra_id e categoria_id são obrigatórios");
            }
            const compra = await entities.Gasto.create({
                descricao,
                valor: parseFloat(valor),
                data: data || new Date().toISOString().split('T')[0],
                fornecedor_id,
                obra_id,
                categoria_id,
                subcategoria_id,
                etapa_obra_ids,
                status_pagamento: "pago"
            });
            return ok(compra, "Compra registrada com sucesso");
        }

        // ─── GENERIC ENTITY CRUD (backward compatibility) ─────────────────────

        if (entityName && operation) {
            if (!entityName || !operation) return err("entityName e operation são obrigatórios");

            const entityClient = entities[entityName];
            if (!entityClient) return err(`Entidade "${entityName}" não encontrada`, 404);

            let result;
            switch (operation) {
                case 'list':
                    result = await entityClient.list(payload?.sort, payload?.limit, payload?.query, payload?.skip);
                    break;
                case 'get':
                    if (!payload?.id) return err("ID é obrigatório para get");
                    result = await entityClient.get(payload.id);
                    break;
                case 'create':
                    if (!payload?.data) return err("data é obrigatório para create");
                    result = await entityClient.create(payload.data);
                    break;
                case 'bulkCreate':
                    if (!payload?.data || !Array.isArray(payload.data)) return err("data (array) é obrigatório para bulkCreate");
                    result = await entityClient.bulkCreate(payload.data);
                    break;
                case 'update':
                    if (!payload?.id || !payload?.data) return err("id e data são obrigatórios para update");
                    result = await entityClient.update(payload.id, payload.data);
                    break;
                case 'delete':
                    if (!payload?.id) return err("ID é obrigatório para delete");
                    result = await entityClient.delete(payload.id);
                    break;
                case 'filter':
                    result = await entityClient.filter(payload?.query || {}, payload?.sort, payload?.limit);
                    break;
                default:
                    return err(`Operação "${operation}" não suportada. Use: list, get, create, bulkCreate, update, delete, filter`);
            }
            return ok(result);
        }

        return err("Informe 'endpoint' (ex: '/boletos') ou 'entityName' + 'operation'");

    } catch (error) {
        console.error("Erro na API J&T Gomes:", error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});