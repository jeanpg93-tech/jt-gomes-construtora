# Migração Base44 → Supabase → Lovable

**Retomada em 02/10/2026:** seguir primeiro [PLANO.md](PLANO.md), que inclui a exportação completa recuperada, as inconsistências da origem e o destino Lovable já criado. O novo `import_snapshot.py` prepara a carga completa com arquivo privado; o importador `import_data.py` descrito abaixo serve apenas ao pacote parcial de 26/09.

## Preparar o snapshot completo para ensaio

O snapshot e seus arquivos SQL/relatório ficam fora do repositório. A geração padrão verifica todas as entidades e bloqueia SQL quando há relações sem conciliação. Para um ensaio revisado que preserve essas relações no arquivo privado:

```sh
python3 migracao-supabase/import_snapshot.py /CAMINHO/PRIVADO/DO/SNAPSHOT \
  --allow-reconciliation \
  --write-sql /CAMINHO/PRIVADO/carga-ensaio.sql \
  --write-report /CAMINHO/PRIVADO/relatorio-ensaio.json
```

Os arquivos de saída devem ser novos. O gerador recusa gravá-los dentro do repositório. `--allow-reconciliation` autoriza apenas a preparação de carga com registros segregados; não resolve vínculos nem libera a aplicação para produção. O relatório separa valores originais e operacionais. Perfis antigos são arquivados, sem criar contas Auth ou administradores automaticamente. A migração SQL revisada precisa existir antes de executar o SQL gerado.

O backup foi exportado em 26/09/2026. Contém 3 obras, 263 gastos, 15 categorias, 34 subcategorias e 1 contrato. Receitas, categorias de receita e subcategorias de segundo nível estão vazias. Não há backup de usuários, fornecedores, parcelas, gastos administrativos, recibos ou materiais. As tabelas foram preparadas para esses módulos, mas não é possível reconstruir registros ausentes do backup.

| Obra | Gastos | Total |
|---|---:|---:|
| Residencial Ipanema II | 232 | R$ 1.255.571,16 |
| Residencial Guilhermina (3 Casas) | 31 | R$ 676.478,11 |
| 2 Triplex Alto Padrão (Guilhermina) | 0 | R$ 0,00 |
| **Total** | **263** | **R$ 1.932.049,27** |

## Estado atual

A conta e a organização Supabase existem; o usuário ainda não criou um projeto. As ferramentas Supabase/Lovable não estão disponíveis nesta conversa. A migração local foi preparada; nenhum banco remoto foi criado, nenhuma importação remota foi executada e nada foi enviado ao GitHub ou publicado no Lovable.

O frontend usa `@supabase/supabase-js`, com CRUD preservando o contrato usado pelas telas e paginação automática para não truncar relatórios no limite de linhas do Supabase. Há login/cadastro por email e senha, aprovação administrativa, storage privado e URLs temporárias assinadas. As variáveis Base44 não são mais utilizadas.

## Preparar o projeto remoto

1. Disponibilize acesso Supabase ao agente, ou crie um projeto na organização correta pelo painel. Nome sugerido: `jt-gomes-construtora`. Confirme a organização Kalel, o plano gratuito e a disponibilidade de capacidade; não crie um projeto pago para contornar limites. São Paulo é uma região adequada se os usuários e dados estão no Brasil.
2. Aplique **uma vez** `supabase/migrations/202610020001_base44_to_supabase.sql` em um projeto novo. `schema.sql` contém a mesma migração para uso pelo SQL Editor; não execute ambos. A migração cria 19 tabelas, referências, políticas RLS, funções e bucket privado `documentos` com limite de 10 MiB por arquivo.
3. Copie a URL do projeto e a chave **pública/publishable** para `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, no ambiente de desenvolvimento e no Lovable. A chave legada `anon` é aceita via `VITE_SUPABASE_ANON_KEY`. Senha do banco e chave `service_role` nunca vão ao frontend nem ao chat.
4. Configure a URL real do site e as URLs autorizadas de redirecionamento no Supabase Auth. Mantenha confirmação de email ativada. Configure SMTP para entrega confiável se necessário; envio de email de confirmação deve ser testado no serviço real.
5. Permita na rede do ambiente o hostname exato do projeto quando ele for conhecido. Se usar integração/API de gerenciamento, permita também os destinos exigidos por ela. Não substitua uma lista de rede desconhecida.

## Importar os dados

Validação offline, sem credenciais:

```sh
npm run migration:check
```

Gere SQL transacional em um arquivo fora da pasta pública, que ainda não exista:

```sh
python3 migracao-supabase/import_data.py --write-sql /tmp/jt-gomes-import.sql
```

Aplique esse SQL pelo SQL Editor ou por uma ferramenta Supabase autorizada. O arquivo contém os dados da empresa; não o publique como asset. Os IDs, campos exportados, timestamps e precisão numérica são preservados. Em conflitos com dados já existentes, a transação falha sem sobrescrevê-los. Repetir uma importação compatível não duplica registros. Alterações feitas depois da importação podem causar conflito numa nova execução; não a use como sincronização de dados.

Alternativa via PostgreSQL: instale `psycopg[binary]` em um venv, configure `SUPABASE_DB_URL` por meio seguro e execute:

```sh
python3 migracao-supabase/import_data.py --import
```

A conexão verifica certificado e hostname (`verify-full`). Nunca enfraqueça TLS para contornar falhas. A conexão PostgreSQL pode exigir acesso específico não disponível no proxy HTTPS; nesse caso use SQL Editor/MCP. Não passe senha pela linha de comando. O script não cria o schema.

Uma foto de obra ainda usa a URL pública antiga do Base44. A tentativa de preservá-la nesta máquina foi bloqueada pelo proxy (403 ao domínio). Antes de desligar Base44, copie esse arquivo para storage privado, valide os bytes e atualize `foto_url` para `storage://documentos/<caminho>`. Preserve o backup original; o importador compara os campos exportados e detectará a mudança em uma reimportação.

## Primeiro administrador e usuários

As senhas e contas de usuário do Base44 não estão no backup e não são migradas. Crie a nova conta pela tela `/login`, confirme o email e promova explicitamente o usuário correto no SQL Editor:

```sql
-- Substitua pelo UUID confirmado em Authentication > Users; não use um ID Base44.
UPDATE public.profiles SET role = 'admin', active = true WHERE id = '<UUID_DO_ADMIN>'::uuid;
```

Faça essa operação somente depois de verificar a identidade da conta. Nenhuma inscrição pública recebe perfil de administrador automaticamente.

Solicitações públicas passam por uma função que ignora status/permissões fornecidos pelo visitante. O administrador aprova pelo módulo Usuários; a aprovação ativa uma conta existente ou é aplicada quando a conta daquele email for criada. Negar acesso desativa contas comuns. As políticas RLS aplicam leitura, edição e exclusão conforme os módulos; edição não concede exclusão. Relatórios precisam de leitura dos módulos financeiros consultados. A opção histórica de ocultar valores em relatórios não é um mecanismo de isolamento de dados; revise essa funcionalidade se precisar dela.

As políticas de storage permitem leitura dos documentos privados a membros ativos da construtora, uploads em pasta própria com permissão de edição e exclusão por proprietário/admin. Reavalie a política se documentos exigirem isolamento adicional entre usuários. O frontend guarda referências estáveis e gera URLs de uma hora quando abre os arquivos.

## Lovable e integrações externas

A sincronização com GitHub e a capacidade de importar um repositório existente no Lovable devem ser verificadas na conta. Não foi criada uma aplicação Lovable, nem presumida importação automática do repositório. Reutilize este frontend e conecte o mesmo projeto Supabase, preservando histórico e dados.

WhatsApp/agente Base44, API de IA e emails personalizados de aprovação/negação dependem de novos serviços/funções e estão **pendentes**. A versão migrada não expõe a antiga chave estática na interface nem promete envio desses emails. O backend antigo ainda existe; desative a integração e troque a chave antiga no serviço original ao fazer o corte, pois remover código local não revoga a chave remotamente.

O módulo API mostra essa pendência e a página WhatsApp informa que a conexão aguarda configuração. Não trate isso como uma migração funcional dessas integrações.

## Validação

`npm test` executa PostgreSQL real em PGlite, com schemas mínimos de Auth/Storage para validar SQL, importação completa e RLS. O cliente REST é testado com respostas controladas. Esses testes não verificam disponibilidade, configuração Auth, SMTP ou storage do projeto remoto.

Na máquina de onboarding também foram verificados build, entrega dos módulos e a tela sem configuração. O smoke de navegador com respostas Supabase simuladas valida login/rota protegida e total financeiro; não comprova operação no projeto remoto.

Depois de conectar o projeto, valide: login e confirmação de email; cadastro aguardando aprovação; autorização admin/usuário; totais e IDs importados; leitura das telas; criação/edição/exclusão de um registro de teste autorizado; parcelas; upload/abertura de arquivo e acesso negado a visitantes. Remova apenas registros criados nesse teste. Só depois valide a publicação no Lovable e faça o corte do Base44.
