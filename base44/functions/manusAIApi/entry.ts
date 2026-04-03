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

function normalizeDate(value, fallback = null) {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    if (value.includes('T')) return value.slice(0, 10);
    return value;
}

function normalizeGastoPayload(input = {}) {
    return {
        ...input,
        valor: input.valor !== undefined ? Number(input.valor) : input.valor,
        valor_total_recorrencia: input.valor_total_recorrencia !== undefined ? Number(input.valor_total_recorrencia) : input.valor_total_recorrencia,
        valor_entrada: input.valor_entrada !== undefined ? Number(input.valor_entrada) : input.valor_entrada,
        quantidade_parcelas: input.quantidade_parcelas !== undefined ? Number(input.quantidade_parcelas) : input.quantidade_parcelas,
        data: normalizeDate(input.data, new Date().toISOString().split('T')[0]),
        data_vencimento: normalizeDate(input.data_vencimento),
        data_pagamento: normalizeDate(input.data_pagamento),
        data_entrada: normalizeDate(input.data_entrada),
        eh_recorrente: input.eh_recorrente === true || input.eh_recorrente === 'true',
    };
}

function normalizeParcelaPayload(input = {}) {
    return {
        ...input,
        valor: input.valor !== undefined ? Number(input.valor) : input.valor,
        numero_parcela: input.numero_parcela !== undefined ? Number(input.numero_parcela) : input.numero_parcela,
        data_vencimento: normalizeDate(input.data_vencimento),
        data_pagamento: normalizeDate(input.data_pagamento),
    };
}

function enrichGastoRecorrencia(gasto, parcelas) {
    const parcelasDoGasto = parcelas
        .filter((parcela) => parcela.gasto_id === gasto.id)
        .sort((a, b) => (a.numero_parcela || 0) - (b.numero_parcela || 0));

    const valorEntrada = Number(gasto.valor_entrada || 0);
    const valorPagoParcelas = parcelasDoGasto
        .filter((parcela) => parcela.status === 'pago')
        .reduce((sum, parcela) => sum + Number(parcela.valor || 0), 0);

    const valorPendenteParcelas = parcelasDoGasto
        .filter((parcela) => parcela.status !== 'pago')
        .reduce((sum, parcela) => sum + Number(parcela.valor || 0), 0);

    const proximaParcela = parcelasDoGasto.find((parcela) => parcela.status !== 'pago') || null;

    const statusCalculado = valorPendenteParcelas > 0 ? 'programado' : 'pago';

    return {
        ...gasto,
        parcelas: parcelasDoGasto,
        status_calculado: statusCalculado,
        recorrencia_resumo: {
            total_parcelas: parcelasDoGasto.length,
            parcelas_pagas: parcelasDoGasto.filter((parcela) => parcela.status === 'pago').length,
            parcelas_pendentes: parcelasDoGasto.filter((parcela) => parcela.status !== 'pago').length,
            valor_entrada,
            valor_pago_parcelas: valorPagoParcelas,
            valor_pago_total: valorEntrada + valorPagoParcelas,
            valor_pendente_parcelas: valorPendenteParcelas,
            proxima_parcela: proximaParcela,
        }
    };
}

async function fetchAll(entityClient, query = {}, sort = null) {
    const all = [];
    let skip = 0;
    const batchSize = 100;
    while (true) {
        const batch = await entityClient.filter(query, sort, batchSize, skip);
        if (!batch || batch.length === 0) break;
        all.push(...batch);
        if (batch.length < batchSize) break;
        skip += batchSize;
    }
    return all;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => ({}));

        if (!checkAuth(req, body)) {
            return err("Unauthorized: Invalid API Key", 401);
        }

        const entities = base44.asServiceRole.entities;
        const { endpoint, operation, entityName } = body;
        const payload = body.payload || body.data || {};

        if (endpoint === "/obras" || endpoint === "obras") {
            const obras = await entities.Obra.filter({ ativa: true }, '-created_date', 100);
            return ok(obras, `${obras.length} obras encontradas`);
        }

        if (endpoint === "/boletos" || endpoint === "boletos") {
            const { status, vencimento_ate, vencimento_de, obra_id, limit = 100, incluir_recorrencia = true } = payload;
            let query = {};
            if (status && status !== 'vencidos') query.status_pagamento = status;
            if (obra_id) query.obra_id = obra_id;

            let gastos = await entities.Gasto.filter(query, 'data_vencimento', limit);
            const parcelas = incluir_recorrencia ? await fetchAll(entities.ParcelaGasto, {}, 'data_vencimento') : [];

            if (vencimento_de) gastos = gastos.filter((g) => g.data_vencimento >= normalizeDate(vencimento_de));
            if (vencimento_ate) gastos = gastos.filter((g) => g.data_vencimento <= normalizeDate(vencimento_ate));

            if (status === "vencidos") {
                const hoje = new Date().toISOString().split('T')[0];
                gastos = gastos.filter((g) => g.status_pagamento !== 'pago' && g.data_vencimento && g.data_vencimento < hoje);
            }

            const resultado = gastos.map((gasto) => {
                if (!incluir_recorrencia || !gasto.eh_recorrente) return gasto;
                return enrichGastoRecorrencia(gasto, parcelas);
            });

            return ok(resultado, `${resultado.length} boletos encontrados`);
        }

        if (endpoint === "/boletos/id" || endpoint === "boletos/id") {
            if (!payload?.id) return err("id é obrigatório");
            const boleto = await entities.Gasto.get(payload.id);
            if (!boleto.eh_recorrente) return ok(boleto);
            const parcelas = await fetchAll(entities.ParcelaGasto, { gasto_id: boleto.id }, 'numero_parcela');
            return ok(enrichGastoRecorrencia(boleto, parcelas));
        }

        if (endpoint === "/boletos/criar" || endpoint === "boletos/criar") {
            const data = normalizeGastoPayload({
                ...payload,
                data_vencimento: payload.vencimento || payload.data_vencimento,
                status_pagamento: payload.status_pagamento || 'pendente',
            });

            if (!data.descricao || data.valor === undefined || !data.obra_id || !data.categoria_id) {
                return err("descricao, valor, obra_id e categoria_id são obrigatórios");
            }

            const boleto = await entities.Gasto.create(data);
            return ok(boleto, "Boleto criado com sucesso");
        }

        if (endpoint === "/boletos/pagar" || endpoint === "boletos/pagar") {
            if (!payload?.id) return err("id é obrigatório");
            const hoje = new Date().toISOString().split('T')[0];
            const atualizado = await entities.Gasto.update(payload.id, {
                status_pagamento: "pago",
                data_pagamento: normalizeDate(payload.data_pagamento, hoje),
                forma_pagamento: payload.forma_pagamento
            });
            return ok(atualizado, "Boleto marcado como pago");
        }

        if (endpoint === "/boletos/deletar" || endpoint === "boletos/deletar") {
            if (!payload?.id) return err("id é obrigatório");
            await entities.Gasto.delete(payload.id);
            return ok({ id: payload.id }, "Boleto removido com sucesso");
        }

        if (endpoint === "/gastos/todos" || endpoint === "gastos/todos") {
            const { obra_id, categoria_id, incluir_recorrencia = true } = payload;
            let query = {};
            if (obra_id) query.obra_id = obra_id;
            if (categoria_id) query.categoria_id = categoria_id;
            const todos = await fetchAll(entities.Gasto, query, '-data');
            if (!incluir_recorrencia) {
                return ok(todos, `${todos.length} gastos encontrados (total)`);
            }
            const parcelas = await fetchAll(entities.ParcelaGasto, {}, 'numero_parcela');
            const resultado = todos.map((gasto) => gasto.eh_recorrente ? enrichGastoRecorrencia(gasto, parcelas) : { ...gasto, status_calculado: gasto.status_pagamento });
            return ok(resultado, `${resultado.length} gastos encontrados (total)`);
        }

        if (endpoint === "/compras" || endpoint === "compras") {
            const { obra_id, categoria_id, subcategoria_id, status_pagamento, limit = 100, incluir_recorrencia = true } = payload;
            const query = {};
            if (obra_id) query.obra_id = obra_id;
            if (categoria_id) query.categoria_id = categoria_id;
            if (subcategoria_id) query.subcategoria_id = subcategoria_id;
            if (status_pagamento) query.status_pagamento = status_pagamento;
            const compras = await entities.Gasto.filter(query, '-data', limit);
            if (!incluir_recorrencia) {
                return ok(compras, `${compras.length} compras encontradas`);
            }
            const parcelas = await fetchAll(entities.ParcelaGasto, {}, 'numero_parcela');
            const resultado = compras.map((gasto) => gasto.eh_recorrente ? enrichGastoRecorrencia(gasto, parcelas) : { ...gasto, status_calculado: gasto.status_pagamento });
            return ok(resultado, `${resultado.length} compras encontradas`);
        }

        if (endpoint === "/compras/criar" || endpoint === "compras/criar") {
            const data = normalizeGastoPayload(payload);
            if (!data.descricao || data.valor === undefined || !data.obra_id || !data.categoria_id) {
                return err("descricao, valor, obra_id e categoria_id são obrigatórios");
            }
            const compra = await entities.Gasto.create({
                ...data,
                status_pagamento: data.status_pagamento || (data.data_pagamento ? 'pago' : 'pendente')
            });
            return ok(compra, "Compra registrada com sucesso");
        }

        if (endpoint === "/parcelas" || endpoint === "parcelas") {
            const { gasto_id, status, vencimento_de, vencimento_ate, limit = 100 } = payload;
            let query = {};
            if (gasto_id) query.gasto_id = gasto_id;
            if (status) query.status = status;
            let parcelas = await entities.ParcelaGasto.filter(query, 'data_vencimento', limit);
            if (vencimento_de) parcelas = parcelas.filter((p) => p.data_vencimento >= normalizeDate(vencimento_de));
            if (vencimento_ate) parcelas = parcelas.filter((p) => p.data_vencimento <= normalizeDate(vencimento_ate));
            return ok(parcelas, `${parcelas.length} parcelas encontradas`);
        }

        if (endpoint === "/parcelas/criar" || endpoint === "parcelas/criar") {
            const data = normalizeParcelaPayload(payload);
            if (!data.gasto_id || data.numero_parcela === undefined || data.valor === undefined) {
                return err("gasto_id, numero_parcela e valor são obrigatórios");
            }
            const parcela = await entities.ParcelaGasto.create(data);
            return ok(parcela, "Parcela criada com sucesso");
        }

        if (endpoint === "/parcelas/pagar" || endpoint === "parcelas/pagar") {
            if (!payload?.id) return err("id é obrigatório");
            const hoje = new Date().toISOString().split('T')[0];
            const parcela = await entities.ParcelaGasto.update(payload.id, {
                status: 'pago',
                data_pagamento: normalizeDate(payload.data_pagamento, hoje)
            });
            return ok(parcela, "Parcela marcada como paga");
        }

        if (entityName && operation) {
            const normalizedEntityName = entityName === 'Compra' ? 'Gasto' : entityName;
            const entityClient = entities[normalizedEntityName];
            if (!entityClient) return err(`Entidade "${entityName}" não encontrada`, 404);

            let result;
            switch (operation) {
                case 'list': {
                    const rawFilters = body.filters || payload?.filters || payload?.query || {};
                    const filters = Object.fromEntries(Object.entries(rawFilters).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
                    const sort = body.sort || payload?.sort;
                    const limit = (body.limit ?? payload?.limit);
                    const skip = (body.skip ?? payload?.skip);
                    if (Object.keys(filters).length > 0) {
                        result = await entityClient.filter(filters, sort, limit, skip);
                    } else {
                        result = await entityClient.list(sort, limit);
                    }
                    break;
                }
                case 'get':
                    if (!payload?.id) return err("ID é obrigatório para get");
                    result = await entityClient.get(payload.id);
                    break;
                case 'create': {
                    const createData = body.data || payload?.data || payload;
                    if (!createData || Object.keys(createData).length === 0) return err("data é obrigatório para create");
                    result = await entityClient.create(
                        normalizedEntityName === 'Gasto' ? normalizeGastoPayload(createData) :
                        normalizedEntityName === 'ParcelaGasto' ? normalizeParcelaPayload(createData) :
                        createData
                    );
                    break;
                }
                case 'bulkCreate': {
                    const bulkData = body.data || payload?.data;
                    if (!bulkData || !Array.isArray(bulkData)) return err("data (array) é obrigatório para bulkCreate");
                    result = await entityClient.bulkCreate(bulkData);
                    break;
                }
                case 'update': {
                    const updateData = body.data || payload?.data;
                    const updateId = payload?.id || body.id;
                    if (!updateId || !updateData) return err("id e data são obrigatórios para update");
                    result = await entityClient.update(
                        updateId,
                        normalizedEntityName === 'Gasto' ? normalizeGastoPayload(updateData) :
                        normalizedEntityName === 'ParcelaGasto' ? normalizeParcelaPayload(updateData) :
                        updateData
                    );
                    break;
                }
                case 'delete':
                    if (!payload?.id) return err("ID é obrigatório para delete");
                    result = await entityClient.delete(payload.id);
                    break;
                case 'filter': {
                    const rawFilters = body.filters || payload?.filters || payload?.query || {};
                    const filters = Object.fromEntries(Object.entries(rawFilters).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
                    result = await entityClient.filter(filters, payload?.sort, payload?.limit, payload?.skip);
                    break;
                }
                case 'listAll':
                    result = await fetchAll(entityClient, payload?.query || {}, payload?.sort);
                    break;
                case 'count': {
                    const all = await fetchAll(entityClient, payload?.query || {});
                    result = { total: all.length };
                    break;
                }
                default:
                    return err(`Operação "${operation}" não suportada. Use: list, get, create, bulkCreate, update, delete, filter, listAll, count`);
            }
            // Enriquecimento para Gasto (lista ou item único)
            let finalResult = result;
            if (normalizedEntityName === 'Gasto') {
                const includeRec = (body.incluir_recorrencia ?? payload?.incluir_recorrencia);
                const shouldInclude = includeRec === undefined ? true : includeRec;
                if (Array.isArray(result)) {
                    if (shouldInclude) {
                        const parcelas = await fetchAll(entities.ParcelaGasto, {}, 'numero_parcela');
                        finalResult = result.map((g) => g.eh_recorrente ? enrichGastoRecorrencia(g, parcelas) : { ...g, status_calculado: g.status_pagamento });
                    } else {
                        finalResult = result.map((g) => ({ ...g, status_calculado: g.status_pagamento }));
                    }
                } else if (result && typeof result === 'object') {
                    if (shouldInclude && result.eh_recorrente) {
                        const parcelasDoGasto = await fetchAll(entities.ParcelaGasto, { gasto_id: result.id }, 'numero_parcela');
                        finalResult = enrichGastoRecorrencia(result, parcelasDoGasto);
                    } else {
                        finalResult = { ...result, status_calculado: result.status_pagamento };
                    }
                }
            }
            return ok(finalResult);
        }

        return err("Informe 'endpoint' (ex: '/boletos') ou 'entityName' + 'operation'");

    } catch (error) {
        console.error("Erro na API J&T Gomes:", error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});