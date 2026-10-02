# J&T Gomes Construtora — Migração Base44 → Nova Plataforma

## O que é este pacote

Backup completo dos dados do sistema "J&T GOMES CONSTRUTORA" (Base44),
exportado em 26/09/2026 para migração de plataforma.

## Conteúdo

```
├── backup/                    # Dados originais completos (JSON)
│   ├── obra.json              # 3 obras
│   ├── gasto.json             # 263 lançamentos financeiros
│   ├── categoria_gasto.json   # 15 categorias
│   ├── subcategoria_gasto.json # 34 subcategorias
│   ├── contrato.json          # 1 contrato
│   ├── receita.json           # 0 (estrutura vazia)
│   ├── categoria_receita.json # 0 (estrutura vazia)
│   └── subcategoria_gasto2.json # 0 (estrutura vazia)
├── csv/                       # Mesmos dados em CSV (Excel)
├── schema.sql                 # Schema PostgreSQL (Supabase)
├── import_data.py             # Script de importação para o novo banco
└── README.md
```

## Validação (checksum dos dados)

| Obra | Registros | Total |
|------|-----------|-------|
| Residencial Ipanema II | 232 | R$ 1.255.571,16 |
| Residencial Guilhermina (3 Casas) | 31 | R$ 676.478,11 |
| 2 Triplex Alto Padrão (Guilhermina) | 0 | — |
| **Total** | **263** | **R$ 1.932.049,27** |

Ipanema II — Materiais: R$ 429.499,65 ✔
(confere com os valores exibidos no sistema original)

## Como importar para o Supabase

1. Crie um projeto no Supabase (supabase.com)
2. No SQL Editor, rode o conteúdo de `schema.sql`
3. Pegue a connection string (Project Settings → Database)
4. Rode:
   ```
   pip install psycopg[binary]
   python import_data.py "postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres"
   ```
5. Os 263 gastos, 3 obras e todos os cadastros entram com os IDs originais preservados.

## Estrutura dos dados

**gasto** (lançamento financeiro):
- `obra_id` → obra vinculada
- `categoria_id` → categoria (ex: Materiais, Mão de Obra, Terreno)
- `subcategoria_id` → subcategoria (ex: Cimento, Areia, Empreiteiro)
- `status_pagamento`: `pago` / `pendente` / `programado`
- `forma_pagamento`: pix / boleto / transferencia

**Obras ativas:**
- Residencial Ipanema II (em_andamento) — Rua Santana do Ipanema, 1063 - Ocian - Praia Grande
- Residencial Guilhermina (3 Casas) (planejamento) — Rua Haiti - Guilhermina

## Observações

- Os IDs originais do Base44 foram preservados para manter a integridade das referências.
- Nenhum gasto tinha arquivo anexo ou fornecedor preenchido no momento da exportação.
- Receitas estavam vazias (nenhum registro).
- Para desenvolvimento com o Codex: use este repositório como base, conecte o Supabase e construa o frontend (React + Vite + Tailwind é uma boa combinação).
