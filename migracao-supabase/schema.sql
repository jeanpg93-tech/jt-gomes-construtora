-- =====================================================
-- J&T GOMES CONSTRUTORA - Sistema de Gestão de Obras
-- Schema PostgreSQL (Supabase) - Migração do Base44
-- Exportado em: 2026-09-26
-- =====================================================

-- Tabela de Obras
CREATE TABLE IF NOT EXISTS obras (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    area_construida NUMERIC(10,2),
    area_terreno NUMERIC(10,2),
    data_inicio DATE,
    data_previsao_entrega DATE,
    status TEXT DEFAULT 'planejamento',
    ativa BOOLEAN DEFAULT true,
    valor_terreno NUMERIC(14,2),
    valor_mao_obra_m2 NUMERIC(10,2),
    previsao_gastos_materiais NUMERIC(14,2),
    valor_venda_projetado NUMERIC(14,2),
    valor_venda_real NUMERIC(14,2),
    imposto_percentual NUMERIC(5,2) DEFAULT 5.0,
    comissao_percentual NUMERIC(5,2) DEFAULT 6.0,
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de Gasto
CREATE TABLE IF NOT EXISTS categorias_gasto (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategorias de Gasto
CREATE TABLE IF NOT EXISTS subcategorias_gasto (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria_id TEXT REFERENCES categorias_gasto(id)
);

-- Gastos (lançamentos financeiros)
CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY,
    obra_id TEXT NOT NULL REFERENCES obras(id),
    descricao TEXT NOT NULL,
    categoria_id TEXT REFERENCES categorias_gasto(id),
    subcategoria_id TEXT REFERENCES subcategorias_gasto(id),
    valor NUMERIC(14,2) NOT NULL,
    data DATE,
    data_vencimento DATE,
    data_pagamento DATE,
    fornecedor TEXT,
    forma_pagamento TEXT,
    status_pagamento TEXT DEFAULT 'pendente'
        CHECK (status_pagamento IN ('pago','pendente','programado','vencido')),
    observacoes TEXT,
    arquivo_anexo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de Receita (vazia na exportação, estrutura preservada)
CREATE TABLE IF NOT EXISTS categorias_receita (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Receitas (vazia na exportação, estrutura preservada)
CREATE TABLE IF NOT EXISTS receitas (
    id TEXT PRIMARY KEY,
    obra_id TEXT REFERENCES obras(id),
    descricao TEXT,
    categoria_id TEXT,
    tipo TEXT,
    valor NUMERIC(14,2),
    data DATE,
    data_vencimento DATE,
    cliente TEXT,
    forma_pagamento TEXT,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Contratos
CREATE TABLE IF NOT EXISTS contratos (
    id TEXT PRIMARY KEY,
    tipo_contrato TEXT,
    descricao_servicos TEXT,
    obra_id TEXT REFERENCES obras(id),
    area_total TEXT,
    valor_total NUMERIC(14,2),
    valor_m2 NUMERIC(10,2),
    forma_pagamento TEXT,
    data_inicio DATE,
    prazo_quantidade TEXT,
    prazo_unidade TEXT,
    data_termino DATE,
    data_assinatura DATE,
    contratados_ids TEXT[],
    status TEXT DEFAULT 'ativo',
    arquivo_assinado TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gastos_obra ON gastos(obra_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_status ON gastos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_gastos_data ON gastos(data DESC);
CREATE INDEX IF NOT EXISTS idx_receitas_obra ON receitas(obra_id);

-- =====================================================
-- SEED DATA: as tabelas podem ser populadas a partir dos
-- arquivos JSON em /backup ou CSVs em /csv.
-- Exemplo de import (psql):
--   \copy gastos FROM 'csv/gasto.csv' WITH (FORMAT csv, HEADER true)
-- Ou via script Python (ver import_data.py)
-- =====================================================
