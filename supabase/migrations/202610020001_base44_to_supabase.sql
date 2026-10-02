-- Base44 -> Supabase: preserve original text IDs and financial precision.
BEGIN;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active boolean NOT NULL DEFAULT false,
  workspace_name text,
  workspace_logo text,
  construtora_razao_social text,
  construtora_nome_fantasia text,
  construtora_cnpj text,
  construtora_inscricao_estadual text,
  construtora_inscricao_municipal text,
  construtora_endereco text,
  construtora_telefone text,
  construtora_email text,
  representante_nome text,
  representante_cpf text,
  representante_rg text,
  representante_nacionalidade text,
  representante_estado_civil text,
  representante_profissao text,
  permissoes_obras text DEFAULT 'leitura' CHECK (permissoes_obras IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_gastos text DEFAULT 'leitura' CHECK (permissoes_gastos IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_receitas text DEFAULT 'leitura' CHECK (permissoes_receitas IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_relatorios text DEFAULT 'leitura' CHECK (permissoes_relatorios IN ('nenhuma', 'leitura', 'leitura_ocultar_valores')),
  permissoes_fornecedores text DEFAULT 'leitura' CHECK (permissoes_fornecedores IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_contratos text DEFAULT 'leitura' CHECK (permissoes_contratos IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_configuracoes text DEFAULT 'nenhuma' CHECK (permissoes_configuracoes IN ('nenhuma', 'leitura', 'edicao')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.obras (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  endereco text NOT NULL,
  foto_url text,
  area_construida numeric,
  area_terreno numeric,
  data_inicio date,
  data_previsao_entrega date,
  status text DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'finalizada', 'vendida')),
  ativa boolean DEFAULT true,
  valor_terreno numeric(18,2),
  valor_mao_obra_m2 numeric,
  previsao_gastos_materiais numeric(18,2),
  valor_venda_projetado numeric(18,2),
  imposto_percentual numeric,
  comissao_percentual numeric,
  valor_venda_real numeric(18,2),
  observacoes text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.gastos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  numero_sequencial text,
  obra_id text NOT NULL,
  descricao text NOT NULL,
  categoria_id text NOT NULL,
  subcategoria_id text,
  etapa_obra_ids text[],
  valor numeric(18,2) NOT NULL,
  data date NOT NULL,
  data_vencimento date,
  data_pagamento date,
  fornecedor_id text,
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'transferencia', 'boleto', 'financiamento', 'pix')),
  status_pagamento text DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'programado', 'pago', 'atrasado')),
  observacoes text,
  origem_registro text DEFAULT 'web' CHECK (origem_registro IN ('web', 'whatsapp')),
  eh_recorrente boolean DEFAULT false,
  valor_total_recorrencia numeric(18,2),
  valor_entrada numeric(18,2),
  data_entrada date,
  quantidade_parcelas integer,
  arquivo_anexo text,
  fornecedor text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.categorias_gasto (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.subcategorias_gasto (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  categoria_id text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.subcategorias_gasto2 (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  subcategoria_id text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.receitas (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  obra_id text NOT NULL,
  descricao text NOT NULL,
  categoria_id text,
  tipo text NOT NULL CHECK (tipo IN ('venda', 'sinal', 'parcela', 'financiamento', 'aluguel', 'outros')),
  valor numeric(18,2) NOT NULL,
  data date NOT NULL,
  data_vencimento date,
  cliente text,
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'transferencia', 'boleto', 'financiamento', 'pix')),
  status text DEFAULT 'prevista' CHECK (status IN ('prevista', 'recebida', 'atrasada')),
  observacoes text,
  origem_registro text DEFAULT 'web' CHECK (origem_registro IN ('web', 'whatsapp')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.categorias_receita (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.contratos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tipo_contrato text NOT NULL,
  tipo_contrato_outro text,
  descricao_servicos text NOT NULL,
  obra_id text,
  obra_nome text,
  obra_endereco text,
  area_total text,
  valor_total numeric(18,2),
  valor_m2 numeric,
  forma_pagamento text,
  data_inicio date,
  prazo_quantidade text,
  prazo_unidade text CHECK (prazo_unidade IN ('dias', 'meses')),
  data_termino date,
  data_assinatura date NOT NULL,
  contratados_ids text[],
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  arquivo_assinado text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.fornecedores (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  -- The legacy short supplier form did not collect a person type.
  tipo text CHECK (tipo IN ('fisica', 'juridica')),
  nome text NOT NULL,
  nome_fantasia text,
  cpf_cnpj text,
  rg text,
  data_nascimento date,
  estado_civil text CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  profissao text,
  naturalidade text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  endereco_completo text,
  representante_nome text,
  representante_cpf text,
  representante_rg text,
  representante_data_nascimento text,
  representante_estado_civil text CHECK (representante_estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  representante_profissao text,
  representante_naturalidade text,
  representante_mesmo_endereco boolean,
  representante_cep text,
  representante_logradouro text,
  representante_numero text,
  representante_complemento text,
  representante_bairro text,
  representante_cidade text,
  representante_estado text,
  representante_endereco_completo text,
  banco text,
  agencia text,
  conta_corrente text,
  titular_conta text,
  cpf_cnpj_titular text,
  pix text,
  telefone text,
  email text,
  observacoes text,
  contato text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.pessoas (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tipo text NOT NULL CHECK (tipo IN ('fisica', 'juridica')),
  nome text NOT NULL,
  nome_fantasia text,
  cpf_cnpj text NOT NULL,
  rg text,
  data_nascimento date,
  estado_civil text CHECK (estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  profissao text,
  naturalidade text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  endereco_completo text,
  representante_nome text,
  representante_cpf text,
  representante_rg text,
  representante_data_nascimento text,
  representante_estado_civil text CHECK (representante_estado_civil IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  representante_profissao text,
  representante_naturalidade text,
  representante_mesmo_endereco boolean,
  representante_cep text,
  representante_logradouro text,
  representante_numero text,
  representante_complemento text,
  representante_bairro text,
  representante_cidade text,
  representante_estado text,
  representante_endereco_completo text,
  banco text,
  agencia text,
  conta_corrente text,
  titular_conta text,
  cpf_cnpj_titular text,
  pix text,
  telefone text,
  email text,
  observacoes text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.etapas_obra (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  ordem integer,
  descricao text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.materiais (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  unidade_medida text NOT NULL CHECK (unidade_medida IN ('un', 'kg', 'm', 'm2', 'm3', 'sc', 'cx', 'pc', 'lt')),
  subcategoria_gasto_id text NOT NULL,
  custo_medio numeric(18,2),
  observacoes text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.materiais_etapas (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  material_id text NOT NULL,
  etapa_obra_id text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.parcelas_gasto (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gasto_id text NOT NULL,
  numero_parcela integer NOT NULL,
  descricao text,
  valor numeric(18,2) NOT NULL,
  data_vencimento date,
  data_pagamento date,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'programado', 'pago', 'atrasado')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.gastos_administrativos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  descricao text NOT NULL,
  categoria_id text NOT NULL,
  valor numeric(18,2) NOT NULL,
  data date NOT NULL,
  fornecedor_id text,
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'transferencia', 'boleto', 'pix')),
  status_pagamento text DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago')),
  observacoes text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.categorias_gasto_administrativo (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome text NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.recibos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fornecedor_id text NOT NULL,
  valor numeric(18,2) NOT NULL,
  data_pagamento date NOT NULL,
  forma_pagamento text NOT NULL,
  referencia_pagamento text NOT NULL,
  data_emissao date,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE TABLE public.solicitacoes_cadastro (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome_completo text NOT NULL,
  email text NOT NULL,
  telefone text,
  cargo_funcao text,
  motivo_acesso text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'negado')),
  data_aprovacao date,
  aprovado_por text,
  motivo_negacao text,
  permissoes_obras text DEFAULT 'leitura' CHECK (permissoes_obras IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_gastos text DEFAULT 'leitura' CHECK (permissoes_gastos IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_receitas text DEFAULT 'leitura' CHECK (permissoes_receitas IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_relatorios text DEFAULT 'leitura' CHECK (permissoes_relatorios IN ('nenhuma', 'leitura', 'leitura_ocultar_valores')),
  permissoes_fornecedores text DEFAULT 'leitura' CHECK (permissoes_fornecedores IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_contratos text DEFAULT 'leitura' CHECK (permissoes_contratos IN ('nenhuma', 'leitura', 'edicao', 'total')),
  permissoes_configuracoes text DEFAULT 'nenhuma' CHECK (permissoes_configuracoes IN ('nenhuma', 'leitura', 'edicao')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE UNIQUE INDEX profiles_email_unique ON public.profiles (lower(email));

ALTER TABLE public.gastos ADD FOREIGN KEY (obra_id) REFERENCES public.obras(id);

CREATE INDEX ON public.gastos (obra_id);

ALTER TABLE public.gastos ADD FOREIGN KEY (categoria_id) REFERENCES public.categorias_gasto(id);

CREATE INDEX ON public.gastos (categoria_id);

ALTER TABLE public.gastos ADD FOREIGN KEY (subcategoria_id) REFERENCES public.subcategorias_gasto(id);

CREATE INDEX ON public.gastos (subcategoria_id);

ALTER TABLE public.gastos ADD FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);

CREATE INDEX ON public.gastos (fornecedor_id);

ALTER TABLE public.subcategorias_gasto ADD FOREIGN KEY (categoria_id) REFERENCES public.categorias_gasto(id);

CREATE INDEX ON public.subcategorias_gasto (categoria_id);

ALTER TABLE public.subcategorias_gasto2 ADD FOREIGN KEY (subcategoria_id) REFERENCES public.subcategorias_gasto(id);

CREATE INDEX ON public.subcategorias_gasto2 (subcategoria_id);

ALTER TABLE public.receitas ADD FOREIGN KEY (obra_id) REFERENCES public.obras(id);

CREATE INDEX ON public.receitas (obra_id);

ALTER TABLE public.receitas ADD FOREIGN KEY (categoria_id) REFERENCES public.categorias_receita(id);

CREATE INDEX ON public.receitas (categoria_id);

ALTER TABLE public.contratos ADD FOREIGN KEY (obra_id) REFERENCES public.obras(id);

CREATE INDEX ON public.contratos (obra_id);

ALTER TABLE public.materiais ADD FOREIGN KEY (subcategoria_gasto_id) REFERENCES public.subcategorias_gasto(id);

CREATE INDEX ON public.materiais (subcategoria_gasto_id);

ALTER TABLE public.materiais_etapas ADD FOREIGN KEY (material_id) REFERENCES public.materiais(id);

CREATE INDEX ON public.materiais_etapas (material_id);

ALTER TABLE public.materiais_etapas ADD FOREIGN KEY (etapa_obra_id) REFERENCES public.etapas_obra(id);

CREATE INDEX ON public.materiais_etapas (etapa_obra_id);

ALTER TABLE public.parcelas_gasto ADD FOREIGN KEY (gasto_id) REFERENCES public.gastos(id) ON DELETE CASCADE;

CREATE INDEX ON public.parcelas_gasto (gasto_id);

ALTER TABLE public.gastos_administrativos ADD FOREIGN KEY (categoria_id) REFERENCES public.categorias_gasto_administrativo(id);

CREATE INDEX ON public.gastos_administrativos (categoria_id);

ALTER TABLE public.gastos_administrativos ADD FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);

CREATE INDEX ON public.gastos_administrativos (fornecedor_id);

ALTER TABLE public.recibos ADD FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);

CREATE INDEX ON public.recibos (fornecedor_id);

CREATE INDEX ON public.gastos (data DESC);
CREATE UNIQUE INDEX ON public.parcelas_gasto (gasto_id, numero_parcela);

CREATE FUNCTION public.touch_updated_date() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_date = now(); RETURN NEW; END $$;

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.categorias_gasto FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.subcategorias_gasto FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.subcategorias_gasto2 FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.receitas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.categorias_receita FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.pessoas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.etapas_obra FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.materiais_etapas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.parcelas_gasto FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.gastos_administrativos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.categorias_gasto_administrativo FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.solicitacoes_cadastro FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE TRIGGER touch_updated_date BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_date();

CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active AND role = 'admin');
$$;
CREATE FUNCTION public.is_active_member() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND active);
$$;
CREATE FUNCTION public.has_permission(module_name text, operation text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.active AND
    (p.role = 'admin' OR CASE operation
      WHEN 'read' THEN to_jsonb(p)->>('permissoes_' || module_name) IN ('leitura','edicao','total')
      WHEN 'write' THEN to_jsonb(p)->>('permissoes_' || module_name) IN ('edicao','total')
      WHEN 'delete' THEN to_jsonb(p)->>('permissoes_' || module_name) = 'total'
      ELSE false END));
$$;

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.obras FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.obras TO authenticated;

CREATE POLICY member_read ON public.obras FOR SELECT TO authenticated USING (public.has_permission('obras', 'read'));

CREATE POLICY member_insert ON public.obras FOR INSERT TO authenticated WITH CHECK (public.has_permission('obras', 'write'));

CREATE POLICY member_update ON public.obras FOR UPDATE TO authenticated USING (public.has_permission('obras', 'write')) WITH CHECK (public.has_permission('obras', 'write'));

CREATE POLICY member_delete ON public.obras FOR DELETE TO authenticated USING (public.has_permission('obras', 'delete'));

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.gastos FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos TO authenticated;

CREATE POLICY member_read ON public.gastos FOR SELECT TO authenticated USING (public.has_permission('gastos', 'read'));

CREATE POLICY member_insert ON public.gastos FOR INSERT TO authenticated WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_update ON public.gastos FOR UPDATE TO authenticated USING (public.has_permission('gastos', 'write')) WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_delete ON public.gastos FOR DELETE TO authenticated USING (public.has_permission('gastos', 'delete'));

ALTER TABLE public.categorias_gasto ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.categorias_gasto FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_gasto TO authenticated;

CREATE POLICY member_read ON public.categorias_gasto FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.categorias_gasto FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.categorias_gasto FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.categorias_gasto FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.subcategorias_gasto ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subcategorias_gasto FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategorias_gasto TO authenticated;

CREATE POLICY member_read ON public.subcategorias_gasto FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.subcategorias_gasto FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.subcategorias_gasto FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.subcategorias_gasto FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.subcategorias_gasto2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subcategorias_gasto2 FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategorias_gasto2 TO authenticated;

CREATE POLICY member_read ON public.subcategorias_gasto2 FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.subcategorias_gasto2 FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.subcategorias_gasto2 FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.subcategorias_gasto2 FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.receitas FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;

CREATE POLICY member_read ON public.receitas FOR SELECT TO authenticated USING (public.has_permission('receitas', 'read'));

CREATE POLICY member_insert ON public.receitas FOR INSERT TO authenticated WITH CHECK (public.has_permission('receitas', 'write'));

CREATE POLICY member_update ON public.receitas FOR UPDATE TO authenticated USING (public.has_permission('receitas', 'write')) WITH CHECK (public.has_permission('receitas', 'write'));

CREATE POLICY member_delete ON public.receitas FOR DELETE TO authenticated USING (public.has_permission('receitas', 'delete'));

ALTER TABLE public.categorias_receita ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.categorias_receita FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_receita TO authenticated;

CREATE POLICY member_read ON public.categorias_receita FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.categorias_receita FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.categorias_receita FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.categorias_receita FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.contratos FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;

CREATE POLICY member_read ON public.contratos FOR SELECT TO authenticated USING (public.has_permission('contratos', 'read'));

CREATE POLICY member_insert ON public.contratos FOR INSERT TO authenticated WITH CHECK (public.has_permission('contratos', 'write'));

CREATE POLICY member_update ON public.contratos FOR UPDATE TO authenticated USING (public.has_permission('contratos', 'write')) WITH CHECK (public.has_permission('contratos', 'write'));

CREATE POLICY member_delete ON public.contratos FOR DELETE TO authenticated USING (public.has_permission('contratos', 'delete'));

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.fornecedores FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;

CREATE POLICY member_read ON public.fornecedores FOR SELECT TO authenticated USING (public.has_permission('fornecedores', 'read'));

CREATE POLICY member_insert ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (public.has_permission('fornecedores', 'write'));

CREATE POLICY member_update ON public.fornecedores FOR UPDATE TO authenticated USING (public.has_permission('fornecedores', 'write')) WITH CHECK (public.has_permission('fornecedores', 'write'));

CREATE POLICY member_delete ON public.fornecedores FOR DELETE TO authenticated USING (public.has_permission('fornecedores', 'delete'));

ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pessoas FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pessoas TO authenticated;

CREATE POLICY member_read ON public.pessoas FOR SELECT TO authenticated USING (public.has_permission('fornecedores', 'read'));

CREATE POLICY member_insert ON public.pessoas FOR INSERT TO authenticated WITH CHECK (public.has_permission('fornecedores', 'write'));

CREATE POLICY member_update ON public.pessoas FOR UPDATE TO authenticated USING (public.has_permission('fornecedores', 'write')) WITH CHECK (public.has_permission('fornecedores', 'write'));

CREATE POLICY member_delete ON public.pessoas FOR DELETE TO authenticated USING (public.has_permission('fornecedores', 'delete'));

ALTER TABLE public.etapas_obra ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.etapas_obra FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapas_obra TO authenticated;

CREATE POLICY member_read ON public.etapas_obra FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.etapas_obra FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.etapas_obra FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.etapas_obra FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.materiais FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;

CREATE POLICY member_read ON public.materiais FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.materiais FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.materiais FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.materiais FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.materiais_etapas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.materiais_etapas FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais_etapas TO authenticated;

CREATE POLICY member_read ON public.materiais_etapas FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.materiais_etapas FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.materiais_etapas FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.materiais_etapas FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.parcelas_gasto ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.parcelas_gasto FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcelas_gasto TO authenticated;

CREATE POLICY member_read ON public.parcelas_gasto FOR SELECT TO authenticated USING (public.has_permission('gastos', 'read'));

CREATE POLICY member_insert ON public.parcelas_gasto FOR INSERT TO authenticated WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_update ON public.parcelas_gasto FOR UPDATE TO authenticated USING (public.has_permission('gastos', 'write')) WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_delete ON public.parcelas_gasto FOR DELETE TO authenticated USING (public.has_permission('gastos', 'delete'));

ALTER TABLE public.gastos_administrativos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.gastos_administrativos FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos_administrativos TO authenticated;

CREATE POLICY member_read ON public.gastos_administrativos FOR SELECT TO authenticated USING (public.has_permission('gastos', 'read'));

CREATE POLICY member_insert ON public.gastos_administrativos FOR INSERT TO authenticated WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_update ON public.gastos_administrativos FOR UPDATE TO authenticated USING (public.has_permission('gastos', 'write')) WITH CHECK (public.has_permission('gastos', 'write'));

CREATE POLICY member_delete ON public.gastos_administrativos FOR DELETE TO authenticated USING (public.has_permission('gastos', 'delete'));

ALTER TABLE public.categorias_gasto_administrativo ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.categorias_gasto_administrativo FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_gasto_administrativo TO authenticated;

CREATE POLICY member_read ON public.categorias_gasto_administrativo FOR SELECT TO authenticated USING (public.is_active_member());

CREATE POLICY member_insert ON public.categorias_gasto_administrativo FOR INSERT TO authenticated WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_update ON public.categorias_gasto_administrativo FOR UPDATE TO authenticated USING (public.has_permission('configuracoes', 'write')) WITH CHECK (public.has_permission('configuracoes', 'write'));

CREATE POLICY member_delete ON public.categorias_gasto_administrativo FOR DELETE TO authenticated USING (public.has_permission('configuracoes', 'write'));

ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.recibos FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recibos TO authenticated;

CREATE POLICY member_read ON public.recibos FOR SELECT TO authenticated USING (public.has_permission('contratos', 'read'));

CREATE POLICY member_insert ON public.recibos FOR INSERT TO authenticated WITH CHECK (public.has_permission('contratos', 'write'));

CREATE POLICY member_update ON public.recibos FOR UPDATE TO authenticated USING (public.has_permission('contratos', 'write')) WITH CHECK (public.has_permission('contratos', 'write'));

CREATE POLICY member_delete ON public.recibos FOR DELETE TO authenticated USING (public.has_permission('contratos', 'delete'));

ALTER TABLE public.solicitacoes_cadastro ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.solicitacoes_cadastro FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_cadastro TO authenticated;

CREATE POLICY requests_admin ON public.solicitacoes_cadastro FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profile_admin_update ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE FUNCTION public.request_access(payload jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id text;
BEGIN
  IF coalesce(trim(payload->>'nome_completo'), '') = '' OR coalesce(payload->>'email', '') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Nome e email válidos são obrigatórios';
  END IF;
  INSERT INTO public.solicitacoes_cadastro (nome_completo,email,telefone,cargo_funcao,motivo_acesso,status)
  VALUES (left(trim(payload->>'nome_completo'),200),lower(trim(payload->>'email')),left(payload->>'telefone',40),left(payload->>'cargo_funcao',200),left(payload->>'motivo_acesso',2000),'pendente') RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.solicitacoes_cadastro;
BEGIN
  INSERT INTO public.profiles (id,email,full_name) VALUES (NEW.id,lower(NEW.email),coalesce(NEW.raw_user_meta_data->>'full_name',''));
  SELECT * INTO r FROM public.solicitacoes_cadastro WHERE lower(email) = lower(NEW.email) ORDER BY created_date DESC, id DESC LIMIT 1;
  IF r.status = 'aprovado' THEN UPDATE public.profiles SET active = true, permissoes_obras = r.permissoes_obras, permissoes_gastos = r.permissoes_gastos, permissoes_receitas = r.permissoes_receitas, permissoes_relatorios = r.permissoes_relatorios, permissoes_fornecedores = r.permissoes_fornecedores, permissoes_contratos = r.permissoes_contratos, permissoes_configuracoes = r.permissoes_configuracoes WHERE id = NEW.id; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE FUNCTION public.apply_access_decision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.solicitacoes_cadastro;
BEGIN
  r := NEW;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.profiles SET active = (NEW.status = 'aprovado'), permissoes_obras = r.permissoes_obras, permissoes_gastos = r.permissoes_gastos, permissoes_receitas = r.permissoes_receitas, permissoes_relatorios = r.permissoes_relatorios, permissoes_fornecedores = r.permissoes_fornecedores, permissoes_contratos = r.permissoes_contratos, permissoes_configuracoes = r.permissoes_configuracoes WHERE lower(email) = lower(NEW.email) AND role <> 'admin';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER apply_access_decision AFTER UPDATE ON public.solicitacoes_cadastro FOR EACH ROW EXECUTE FUNCTION public.apply_access_decision();

CREATE FUNCTION public.update_my_profile(payload jsonb) RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.profiles; current_profile public.profiles;
BEGIN
  SELECT * INTO current_profile FROM public.profiles WHERE id = auth.uid();
  IF current_profile.id IS NULL OR NOT current_profile.active THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF NOT public.has_permission('configuracoes','write') THEN RAISE EXCEPTION 'Sem permissão para alterar configurações'; END IF;
  UPDATE public.profiles p SET workspace_name = CASE WHEN payload ? 'workspace_name' THEN payload->>'workspace_name' ELSE p.workspace_name END,
    workspace_logo = CASE WHEN payload ? 'workspace_logo' THEN payload->>'workspace_logo' ELSE p.workspace_logo END,
    construtora_razao_social = CASE WHEN payload ? 'construtora_razao_social' THEN payload->>'construtora_razao_social' ELSE p.construtora_razao_social END,
    construtora_nome_fantasia = CASE WHEN payload ? 'construtora_nome_fantasia' THEN payload->>'construtora_nome_fantasia' ELSE p.construtora_nome_fantasia END,
    construtora_cnpj = CASE WHEN payload ? 'construtora_cnpj' THEN payload->>'construtora_cnpj' ELSE p.construtora_cnpj END,
    construtora_inscricao_estadual = CASE WHEN payload ? 'construtora_inscricao_estadual' THEN payload->>'construtora_inscricao_estadual' ELSE p.construtora_inscricao_estadual END,
    construtora_inscricao_municipal = CASE WHEN payload ? 'construtora_inscricao_municipal' THEN payload->>'construtora_inscricao_municipal' ELSE p.construtora_inscricao_municipal END,
    construtora_endereco = CASE WHEN payload ? 'construtora_endereco' THEN payload->>'construtora_endereco' ELSE p.construtora_endereco END,
    construtora_telefone = CASE WHEN payload ? 'construtora_telefone' THEN payload->>'construtora_telefone' ELSE p.construtora_telefone END,
    construtora_email = CASE WHEN payload ? 'construtora_email' THEN payload->>'construtora_email' ELSE p.construtora_email END,
    representante_nome = CASE WHEN payload ? 'representante_nome' THEN payload->>'representante_nome' ELSE p.representante_nome END,
    representante_cpf = CASE WHEN payload ? 'representante_cpf' THEN payload->>'representante_cpf' ELSE p.representante_cpf END,
    representante_rg = CASE WHEN payload ? 'representante_rg' THEN payload->>'representante_rg' ELSE p.representante_rg END,
    representante_nacionalidade = CASE WHEN payload ? 'representante_nacionalidade' THEN payload->>'representante_nacionalidade' ELSE p.representante_nacionalidade END,
    representante_estado_civil = CASE WHEN payload ? 'representante_estado_civil' THEN payload->>'representante_estado_civil' ELSE p.representante_estado_civil END,
    representante_profissao = CASE WHEN payload ? 'representante_profissao' THEN payload->>'representante_profissao' ELSE p.representante_profissao END,
    full_name = CASE WHEN payload ? 'full_name' THEN payload->>'full_name' ELSE p.full_name END WHERE id = auth.uid() RETURNING * INTO result;
  RETURN result;
END $$;

-- Private storage: object paths remain stable; the frontend signs URLs on demand.
INSERT INTO storage.buckets (id,name,public,file_size_limit) VALUES ('documentos','documentos',false,10485760) ON CONFLICT (id) DO NOTHING;
CREATE POLICY documents_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos' AND public.is_active_member());
CREATE POLICY documents_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos' AND public.is_active_member() AND (storage.foldername(name))[1] = auth.uid()::text AND (public.has_permission('obras','write') OR public.has_permission('gastos','write') OR public.has_permission('contratos','write') OR public.has_permission('configuracoes','write')));
CREATE POLICY documents_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos' AND public.is_active_member() AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- PostgreSQL grants EXECUTE to PUBLIC by default: explicitly narrow every definer function.
REVOKE ALL ON FUNCTION public.request_access(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_access(jsonb) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.update_my_profile(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin(), public.is_active_member(), public.has_permission(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(), public.is_active_member(), public.has_permission(text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user(), public.apply_access_decision(), public.touch_updated_date() FROM PUBLIC;

-- Full source evidence and unresolved references stay outside exposed API schemas.
CREATE SCHEMA migration_private;
REVOKE ALL ON SCHEMA migration_private FROM PUBLIC, anon, authenticated;
CREATE TABLE migration_private.snapshots (
  id text PRIMARY KEY,
  app_id text NOT NULL,
  manifest jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE migration_private.source_records (
  snapshot_id text NOT NULL REFERENCES migration_private.snapshots(id),
  entity text NOT NULL,
  source_id text NOT NULL,
  raw_record jsonb NOT NULL,
  disposition text NOT NULL CHECK (disposition IN ('imported', 'reconcile', 'auth_pending')),
  issues jsonb NOT NULL,
  PRIMARY KEY (snapshot_id, entity, source_id)
);
ALTER TABLE migration_private.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_private.source_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA migration_private FROM PUBLIC, anon, authenticated;
CREATE FUNCTION migration_private.assert_record(condition boolean) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  IF condition IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Conflito com dados existentes; importação completa cancelada';
  END IF;
END $$;
REVOKE ALL ON FUNCTION migration_private.assert_record(boolean) FROM PUBLIC, anon, authenticated;
COMMIT;
