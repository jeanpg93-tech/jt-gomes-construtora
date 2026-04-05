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

function sanitizeFilters(raw = {}) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '') continue;
      out[k] = trimmed;
    } else {
      out[k] = v;
    }
  }
  return out;
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

    const valorEfetivoPago = valorEntrada + valorPagoParcelas;
    const valorEfetivoPendente = valorPendenteParcelas;
    const valorTotalReal = valorEntrada + parcelasDoGasto.reduce((sum, p) => sum + Number(p.valor || 0), 0);

    return {
        ...gasto,
        // Campos simplificados para soma direta (usar estes em vez de 'valor')
        valor_efetivo_pago: valorEfetivoPago,
        valor_efetivo_pendente: valorEfetivoPendente,
        valor_total_real: valorTotalReal,
        parcelas: parcelasDoGasto,
        status_calculado: statusCalculado,
        recorrencia_resumo: {
            total_parcelas: parcelasDoGasto.length,
            parcelas_pagas: parcelasDoGasto.filter((parcela) => parcela.status === 'pago').length,
            parcelas_pendentes: parcelasDoGasto.filter((parcela) => parcela.status !== 'pago').length,
            valor_entrada: valorEntrada,
            valor_pago_parcelas: valorPagoParcelas,
            valor_pago_total: valorEfetivoPago,
            valor_pendente_parcelas: valorEfetivoPendente,
            valor_total_real: valorTotalReal,
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
            const { status, vencimento_ate, vencimento_de, obra_id, limit, skip = 0, incluir_recorrencia = true } = payload;
            let query = {};
            if (status && status !== 'vencidos') query.status_pagamento = status;
            if (obra_id) query.obra_id = obra_id;

            let gastos = await fetchAll(entities.Gasto, query, 'data_vencimento');
            const parcelas = incluir_recorrencia ? await fetchAll(entities.ParcelaGasto, {}, 'data_vencimento') : [];

            if (vencimento_de) gastos = gastos.filter((g) => g.data_vencimento >= normalizeDate(vencimento_de));
            if (vencimento_ate) gastos = gastos.filter((g) => g.data_vencimento <= normalizeDate(vencimento_ate));

            if (status === "vencidos") {
                const hoje = new Date().toISOString().split('T')[0];
                gastos = gastos.filter((g) => g.status_pagamento !== 'pago' && g.data_vencimento && g.data_vencimento < hoje);
            }

            const totalCount = gastos.length;
            if (skip > 0) gastos = gastos.slice(skip);
            if (limit) gastos = gastos.slice(0, limit);

            const resultado = gastos.map((gasto) => {
                if (!incluir_recorrencia || !gasto.eh_recorrente) return gasto;
                return enrichGastoRecorrencia(gasto, parcelas);
            });

            return ok(resultado, `${resultado.length} de ${totalCount} boletos`);
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
            const { obra_id, categoria_id, subcategoria_id, incluir_recorrencia = true, limit, skip = 0 } = payload;
            const query = sanitizeFilters({ obra_id, categoria_id, subcategoria_id });
            let todos = await fetchAll(entities.Gasto, query, '-data');
            const totalCount = todos.length;
            if (skip > 0) todos = todos.slice(skip);
            if (limit) todos = todos.slice(0, limit);
            if (!incluir_recorrencia) {
                return ok(todos, `${todos.length} de ${totalCount} gastos (total)`);
            }
            const parcelas = await fetchAll(entities.ParcelaGasto, {}, 'numero_parcela');
            const resultado = todos.map((gasto) => {
                const temParcelas = parcelas.some((p) => p.gasto_id === gasto.id);
                if (gasto.eh_recorrente || temParcelas) {
                    return enrichGastoRecorrencia(gasto, parcelas);
                }
                const vPago = gasto.status_pagamento === 'pago' ? Number(gasto.valor || 0) : 0;
                const vPendente = gasto.status_pagamento !== 'pago' ? Number(gasto.valor || 0) : 0;
                return {
                    ...gasto,
                    valor_efetivo_pago: vPago,
                    valor_efetivo_pendente: vPendente,
                    valor_total_real: Number(gasto.valor || 0),
                    status_calculado: gasto.status_pagamento,
                };
            });
            return ok(resultado, `${resultado.length} de ${totalCount} gastos (total)`);
        }

        if (endpoint === "/compras" || endpoint === "compras") {
            const { obra_id, categoria_id, subcategoria_id, status_pagamento, limit, skip = 0, incluir_recorrencia = true } = payload;
            const query = sanitizeFilters({ obra_id, categoria_id, subcategoria_id, status_pagamento });
            let compras = await fetchAll(entities.Gasto, query, '-data');
            const totalCount = compras.length;
            if (skip > 0) compras = compras.slice(skip);
            if (limit) compras = compras.slice(0, limit);
            if (!incluir_recorrencia) {
                return ok(compras, `${compras.length} de ${totalCount} compras`);
            }
            const parcelas = await fetchAll(entities.ParcelaGasto, {}, 'numero_parcela');
            const resultado = compras.map((gasto) => {
                const temParcelas = parcelas.some((p) => p.gasto_id === gasto.id);
                if (gasto.eh_recorrente || temParcelas) {
                    return enrichGastoRecorrencia(gasto, parcelas);
                }
                const vPago = gasto.status_pagamento === 'pago' ? Number(gasto.valor || 0) : 0;
                const vPendente = gasto.status_pagamento !== 'pago' ? Number(gasto.valor || 0) : 0;
                return {
                    ...gasto,
                    valor_efetivo_pago: vPago,
                    valor_efetivo_pendente: vPendente,
                    valor_total_real: Number(gasto.valor || 0),
                    status_calculado: gasto.status_pagamento,
                };
            });
            return ok(resultado, `${resultado.length} de ${totalCount} compras`);
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
            const { gasto_id, status, vencimento_de, vencimento_ate, limit, skip = 0 } = payload;
            let query = {};
            if (gasto_id) query.gasto_id = gasto_id;
            if (status) query.status = status;
            let parcelas = await fetchAll(entities.ParcelaGasto, query, 'data_vencimento');
            if (vencimento_de) parcelas = parcelas.filter((p) => p.data_vencimento >= normalizeDate(vencimento_de));
            if (vencimento_ate) parcelas = parcelas.filter((p) => p.data_vencimento <= normalizeDate(vencimento_ate));
            const totalCount = parcelas.length;
            if (skip > 0) parcelas = parcelas.slice(skip);
            if (limit) parcelas = parcelas.slice(0, limit);
            return ok(parcelas, `${parcelas.length} de ${totalCount} parcelas`);
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
                    // Aceitar filtros comuns diretamente no payload (obra_id, categoria_id, etc.)
                    if (payload?.obra_id && !rawFilters.obra_id) rawFilters.obra_id = payload.obra_id;
                    if (payload?.categoria_id && !rawFilters.categoria_id) rawFilters.categoria_id = payload.categoria_id;
                    if (payload?.subcategoria_id && !rawFilters.subcategoria_id) rawFilters.subcategoria_id = payload.subcategoria_id;
                    if (payload?.status_pagamento && !rawFilters.status_pagamento) rawFilters.status_pagamento = payload.status_pagamento;
                    const filters = sanitizeFilters(rawFilters);
                    const sort = (body.sort ?? payload?.sort);
                    const limit = (body.limit ?? payload?.limit ?? 1000);
                    const skip = (body.skip ?? payload?.skip ?? 0);
                    if (Object.keys(filters).length > 0) {
                        result = await entityClient.filter(filters, sort, limit, skip);
                        // Fallback defensivo: se vier vazio, tenta em memória (obras/categorias/subcategorias/status)
                        if (normalizedEntityName === 'Gasto' && Array.isArray(result) && result.length === 0 &&
                            (filters.obra_id || filters.categoria_id || filters.subcategoria_id || filters.status_pagamento)) {
                            const all = await fetchAll(entityClient, {}, sort);
                            result = all.filter((g) => {
                                if (filters.obra_id && g.obra_id !== filters.obra_id) return false;
                                if (filters.categoria_id && g.categoria_id !== filters.categoria_id) return false;
                                if (filters.subcategoria_id && g.subcategoria_id !== filters.subcategoria_id) return false;
                                if (filters.status_pagamento && g.status_pagamento !== filters.status_pagamento) return false;
                                return true;
                            });
                        }
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
                    // Aceitar filtros comuns diretamente no payload
                    if (payload?.obra_id && !rawFilters.obra_id) rawFilters.obra_id = payload.obra_id;
                    if (payload?.categoria_id && !rawFilters.categoria_id) rawFilters.categoria_id = payload.categoria_id;
                    if (payload?.subcategoria_id && !rawFilters.subcategoria_id) rawFilters.subcategoria_id = payload.subcategoria_id;
                    if (payload?.status_pagamento && !rawFilters.status_pagamento) rawFilters.status_pagamento = payload.status_pagamento;
                    const filters = sanitizeFilters(rawFilters);
                    const sort = (body.sort ?? payload?.sort);
                    const limit = (body.limit ?? payload?.limit ?? 1000);
                    const skip = (body.skip ?? payload?.skip ?? 0);
                    result = await entityClient.filter(filters, sort, limit, skip);
                    // Fallback defensivo para Gasto
                    if (normalizedEntityName === 'Gasto' && Array.isArray(result) && result.length === 0 &&
                        (filters.obra_id || filters.categoria_id || filters.subcategoria_id || filters.status_pagamento)) {
                        const all = await fetchAll(entityClient, {}, sort);
                        result = all.filter((g) => {
                            if (filters.obra_id && g.obra_id !== filters.obra_id) return false;
                            if (filters.categoria_id && g.categoria_id !== filters.categoria_id) return false;
                            if (filters.subcategoria_id && g.subcategoria_id !== filters.subcategoria_id) return false;
                            if (filters.status_pagamento && g.status_pagamento !== filters.status_pagamento) return false;
                            return true;
                        });
                    }
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
                        finalResult = result.map((g) => {
                            const temParcelas = parcelas.some((p) => p.gasto_id === g.id);
                            if (g.eh_recorrente || temParcelas) {
                                return enrichGastoRecorrencia(g, parcelas);
                            }
                            const vPago = g.status_pagamento === 'pago' ? Number(g.valor || 0) : 0;
                            const vPendente = g.status_pagamento !== 'pago' ? Number(g.valor || 0) : 0;
                            return {
                                ...g,
                                valor_efetivo_pago: vPago,
                                valor_efetivo_pendente: vPendente,
                                valor_total_real: Number(g.valor || 0),
                                status_calculado: g.status_pagamento,
                            };
                        });
                    } else {
                        finalResult = result.map((g) => ({
                            ...g,
                            valor_efetivo_pago: g.status_pagamento === 'pago' ? Number(g.valor || 0) : 0,
                            valor_efetivo_pendente: g.status_pagamento !== 'pago' ? Number(g.valor || 0) : 0,
                            valor_total_real: Number(g.valor || 0),
                            status_calculado: g.status_pagamento,
                        }));
                    }
                } else if (result && typeof result === 'object') {
                    if (shouldInclude) {
                        const parcelasDoGasto = await fetchAll(entities.ParcelaGasto, { gasto_id: result.id }, 'numero_parcela');
                        if (result.eh_recorrente || (Array.isArray(parcelasDoGasto) && parcelasDoGasto.length > 0)) {
                            finalResult = enrichGastoRecorrencia(result, parcelasDoGasto);
                        } else {
                            const vPago = result.status_pagamento === 'pago' ? Number(result.valor || 0) : 0;
                            const vPendente = result.status_pagamento !== 'pago' ? Number(result.valor || 0) : 0;
                            finalResult = {
                                ...result,
                                valor_efetivo_pago: vPago,
                                valor_efetivo_pendente: vPendente,
                                valor_total_real: Number(result.valor || 0),
                                status_calculado: result.status_pagamento,
                            };
                        }
                    } else {
                        finalResult = {
                            ...result,
                            valor_efetivo_pago: result.status_pagamento === 'pago' ? Number(result.valor || 0) : 0,
                            valor_efetivo_pendente: result.status_pagamento !== 'pago' ? Number(result.valor || 0) : 0,
                            valor_total_real: Number(result.valor || 0),
                            status_calculado: result.status_pagamento,
                        };
                    }
                }
            }
            return ok(finalResult);
        }

        if (endpoint === "/pagamentos-pendentes" || endpoint === "pagamentos-pendentes") {
            const { obra_id, dias = 10 } = payload;
            const hoje = new Date();
            const hojeStr = hoje.toISOString().split('T')[0];
            const limiteDate = new Date(hoje);
            limiteDate.setDate(limiteDate.getDate() + Number(dias));
            const limiteStr = limiteDate.toISOString().split('T')[0];

            const queryGastos = obra_id ? { obra_id } : {};
            const todosGastos = await fetchAll(entities.Gasto, queryGastos, 'data_vencimento');
            const todasParcelas = await fetchAll(entities.ParcelaGasto, {}, 'data_vencimento');

            const gastosComVencimento = todosGastos
                .filter(g => g.data_vencimento && g.status_pagamento !== 'pago')
                .map(g => ({
                    tipo: 'gasto',
                    id: g.id,
                    descricao: g.descricao,
                    valor: Number(g.valor || 0),
                    data_vencimento: g.data_vencimento,
                    status_pagamento: g.status_pagamento,
                    obra_id: g.obra_id,
                    eh_recorrente: g.eh_recorrente || false,
                }));

            const parcelasComVencimento = todasParcelas
                .filter(p => p.data_vencimento && p.status !== 'pago')
                .map(p => {
                    const gastoPai = todosGastos.find(g => g.id === p.gasto_id);
                    if (!gastoPai) return null;
                    if (obra_id && gastoPai.obra_id !== obra_id) return null;
                    return {
                        tipo: 'parcela',
                        id: p.id,
                        gasto_id: p.gasto_id,
                        descricao: gastoPai.descricao,
                        numero_parcela: p.numero_parcela,
                        valor: Number(p.valor || 0),
                        data_vencimento: p.data_vencimento,
                        status: p.status,
                        obra_id: gastoPai.obra_id,
                    };
                })
                .filter(Boolean);

            const todos = [...gastosComVencimento, ...parcelasComVencimento];

            const vencidos = todos.filter(item => item.data_vencimento < hojeStr);
            const vencendoHoje = todos.filter(item => item.data_vencimento === hojeStr);
            const proximos = todos.filter(item => item.data_vencimento > hojeStr && item.data_vencimento <= limiteStr);

            const valorTotal = [...vencidos, ...vencendoHoje, ...proximos].reduce((s, i) => s + i.valor, 0);

            return ok({
                resumo: {
                    total_pagamentos: vencidos.length + vencendoHoje.length + proximos.length,
                    valor_total: valorTotal,
                    vencidos_count: vencidos.length,
                    vencendo_hoje_count: vencendoHoje.length,
                    proximos_count: proximos.length,
                    periodo_dias: Number(dias),
                    data_referencia: hojeStr,
                    data_limite: limiteStr,
                },
                vencidos,
                vencendo_hoje: vencendoHoje,
                proximos,
            }, `${vencidos.length + vencendoHoje.length + proximos.length} pagamentos pendentes encontrados`);
        }

        if (endpoint === "/pagamentos-pendentes/pagar" || endpoint === "pagamentos-pendentes/pagar") {
            const { id, tipo, data_pagamento, forma_pagamento } = payload;
            if (!id || !tipo) return err("id e tipo ('gasto' ou 'parcela') são obrigatórios");
            const hoje = new Date().toISOString().split('T')[0];
            const dataPag = normalizeDate(data_pagamento, hoje);

            if (tipo === 'parcela') {
                const parcela = await entities.ParcelaGasto.update(id, {
                    status: 'pago',
                    data_pagamento: dataPag,
                });
                return ok(parcela, "Parcela marcada como paga");
            } else {
                const updateData = {
                    status_pagamento: 'pago',
                    data_pagamento: dataPag,
                };
                if (forma_pagamento) updateData.forma_pagamento = forma_pagamento;
                const gasto = await entities.Gasto.update(id, updateData);
                return ok(gasto, "Gasto marcado como pago");
            }
        }

        return err("Informe 'endpoint' (ex: '/boletos', '/pagamentos-pendentes') ou 'entityName' + 'operation'");

    } catch (error) {
        console.error("Erro na API J&T Gomes:", error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});