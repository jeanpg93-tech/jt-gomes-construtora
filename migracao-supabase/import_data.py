#!/usr/bin/env python3
"""
Importa os dados exportados do Base44 para o novo banco PostgreSQL/Supabase.
Uso: python import_data.py DATABASE_URL
Exemplo: python import_data.py postgresql://postgres:[SENHA]@db.xxxx.supabase.co:5432/postgres

Dependências: pip install psycopg[binary]
"""
import json, sys, os

def main():
    if len(sys.argv) < 2:
        print("Uso: python import_data.py DATABASE_URL")
        sys.exit(1)

    import psycopg
    db_url = sys.argv[1]
    base = os.path.dirname(os.path.abspath(__file__))

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Obras
            obras = json.load(open(f'{base}/backup/obra.json', encoding='utf-8'))
            for o in obras:
                cur.execute("""
                    INSERT INTO obras (id, nome, endereco, area_construida, area_terreno, data_inicio,
                        data_previsao_entrega, status, ativa, valor_terreno, valor_mao_obra_m2,
                        previsao_gastos_materiais, valor_venda_projetado, valor_venda_real,
                        imposto_percentual, comissao_percentual, foto_url, observacoes)
                    VALUES (%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s)
                    ON CONFLICT (id) DO NOTHING
                """, (o['id'], o['nome'], o.get('endereco'), o.get('area_construida'), o.get('area_terreno'),
                      o.get('data_inicio'), o.get('data_previsao_entrega'), o.get('status'), o.get('ativa'),
                      o.get('valor_terreno'), o.get('valor_mao_obra_m2'), o.get('previsao_gastos_materiais'),
                      o.get('valor_venda_projetado'), o.get('valor_venda_real'), o.get('imposto_percentual'),
                      o.get('comissao_percentual'), o.get('foto_url'), o.get('observacoes')))
            print(f"Obras: {len(obras)} importadas")

            # Categorias
            cats = json.load(open(f'{base}/backup/categoria_gasto.json', encoding='utf-8'))
            for c in cats:
                cur.execute("INSERT INTO categorias_gasto (id, nome) VALUES (%%s,%%s) ON CONFLICT (id) DO NOTHING", (c['id'], c['nome']))
            print(f"Categorias: {len(cats)} importadas")

            # Subcategorias
            subcats = json.load(open(f'{base}/backup/subcategoria_gasto.json', encoding='utf-8'))
            for s in subcats:
                cur.execute("INSERT INTO subcategorias_gasto (id, nome, categoria_id) VALUES (%%s,%%s,%%s) ON CONFLICT (id) DO NOTHING", (s['id'], s['nome'], s.get('categoria_id')))
            print(f"Subcategorias: {len(subcats)} importadas")

            # Gastos
            gastos = json.load(open(f'{base}/backup/gasto.json', encoding='utf-8'))
            for g in gastos:
                cur.execute("""
                    INSERT INTO gastos (id, obra_id, descricao, categoria_id, subcategoria_id, valor, data,
                        data_vencimento, data_pagamento, forma_pagamento, status_pagamento, observacoes)
                    VALUES (%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s)
                    ON CONFLICT (id) DO NOTHING
                """, (g['id'], g['obra_id'], g['descricao'], g.get('categoria_id'), g.get('subcategoria_id'),
                      g['valor'], g.get('data'), g.get('data_vencimento'), g.get('data_pagamento'),
                      g.get('forma_pagamento'), g.get('status_pagamento'), g.get('observacoes')))
            print(f"Gastos: {len(gastos)} importados")

            # Contratos
            contratos = json.load(open(f'{base}/backup/contrato.json', encoding='utf-8'))
            for c in contratos:
                cur.execute("""
                    INSERT INTO contratos (id, tipo_contrato, descricao_servicos, obra_id, area_total, valor_total,
                        valor_m2, forma_pagamento, data_inicio, prazo_quantidade, prazo_unidade, data_termino,
                        data_assinatura, contratados_ids, status)
                    VALUES (%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s,%%s)
                    ON CONFLICT (id) DO NOTHING
                """, (c['id'], c.get('tipo_contrato'), c.get('descricao_servicos'), c.get('obra_id'),
                      c.get('area_total'), c.get('valor_total'), c.get('valor_m2'), c.get('forma_pagamento'),
                      c.get('data_inicio'), c.get('prazo_quantidade'), c.get('prazo_unidade'),
                      c.get('data_termino'), c.get('data_assinatura'), c.get('contratados_ids'), c.get('status')))
            print(f"Contratos: {len(contratos)} importados")

        conn.commit()
        print("\nImportação concluída com sucesso!")

if __name__ == '__main__':
    main()
