# J&T Gomes Construtora

Sistema de gestão de obras em React, Vite e Tailwind, preparado para Supabase.
O código está em migração do Base44; o projeto remoto Supabase e a integração Lovable ainda precisam ser conectados.

## Desenvolvimento

Node.js 24 e npm (validados com Node 24.19.0/npm 11.9.0).

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Configure em `.env.local` (ignorado pelo Git) ou no ambiente de execução:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Também é aceita a chave pública legada em `VITE_SUPABASE_ANON_KEY`.
Nunca use `service_role`, chave secreta ou senha de banco em variáveis `VITE_*`: o Vite as incorpora ao frontend.
Sem configuração, a aplicação mostra uma tela de configuração e bloqueia o login; não usa valores fictícios.

```sh
npm test                 # PostgreSQL local/PGlite: importação, RLS e cliente REST
npm run migration:check  # valida backup, IDs, referências e totais sem conexão
npm run build
npm run lint
npm run typecheck
```

Lint e typecheck já falhavam antes da migração; seus problemas não foram suprimidos.

## Migração e continuação

Veja [o roteiro de migração](migracao-supabase/MIGRACAO.md) e [o estado para a próxima tarefa](migracao-supabase/CONTINUAR.md).
As migrações de banco ficam em `supabase/migrations/`. O pacote exportado em `migracao-supabase/backup/` permanece intacto.
Não publique os backups como assets do site. O build Vite gera somente o frontend em `dist/`.
