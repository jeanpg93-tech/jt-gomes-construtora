import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Verificação do Segredo (Chave API)
        const body = await req.json();
        const providedSecret = req.headers.get("x-api-secret") || body.secret;

        if (providedSecret !== "J&T_GOMES_CONSTRUTORA_API") {
            return Response.json({ error: 'Unauthorized: Invalid API Secret' }, { status: 401 });
        }

        const { entityName, operation, payload } = body;

        if (!entityName || !operation) {
            return Response.json({ error: 'entityName and operation are required' }, { status: 400 });
        }

        const entityClient = base44.asServiceRole.entities[entityName];

        if (!entityClient) {
            return Response.json({ error: `Entity "${entityName}" not found` }, { status: 404 });
        }

        let result;
        switch (operation) {
            case 'list':
                result = await entityClient.list(
                    payload?.sort,
                    payload?.limit,
                    payload?.query,
                    payload?.skip
                );
                break;
            case 'get':
                if (!payload?.id) return Response.json({ error: 'ID is required for get' }, { status: 400 });
                result = await entityClient.get(payload.id);
                break;
            case 'create':
                if (!payload?.data) return Response.json({ error: 'data is required for create' }, { status: 400 });
                result = await entityClient.create(payload.data);
                break;
            case 'bulkCreate':
                if (!payload?.data || !Array.isArray(payload.data)) return Response.json({ error: 'data (array) is required for bulkCreate' }, { status: 400 });
                result = await entityClient.bulkCreate(payload.data);
                break;
            case 'update':
                if (!payload?.id || !payload?.data) return Response.json({ error: 'id and data are required for update' }, { status: 400 });
                result = await entityClient.update(payload.id, payload.data);
                break;
            case 'delete':
                if (!payload?.id) return Response.json({ error: 'ID is required for delete' }, { status: 400 });
                result = await entityClient.delete(payload.id);
                break;
            case 'filter':
                result = await entityClient.filter(
                    payload?.query || {},
                    payload?.sort,
                    payload?.limit
                );
                break;
            default:
                return Response.json({ error: `Operation "${operation}" not supported. Use: list, get, create, bulkCreate, update, delete, filter` }, { status: 400 });
        }

        return Response.json({ success: true, data: result });

    } catch (error) {
        console.error("Erro na API do Manus AI:", error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});