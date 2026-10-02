#!/usr/bin/env python3
"""Validate the export, generate transactional SQL, or import using SUPABASE_DB_URL.
Never pass database credentials on the command line. psycopg is needed only for --import.
"""
import argparse
import json
import os
from collections import Counter
from decimal import Decimal
from pathlib import Path

BACKUP = Path(__file__).resolve().parent / 'backup'
TABLES = {
    'obra': 'obras', 'categoria_gasto': 'categorias_gasto',
    'subcategoria_gasto': 'subcategorias_gasto', 'subcategoria_gasto2': 'subcategorias_gasto2',
    'categoria_receita': 'categorias_receita', 'gasto': 'gastos',
    'receita': 'receitas', 'contrato': 'contratos',
}
EXPECTED_COUNTS = {'obra': 3, 'categoria_gasto': 15, 'subcategoria_gasto': 34,
                   'gasto': 263, 'contrato': 1, 'receita': 0,
                   'categoria_receita': 0, 'subcategoria_gasto2': 0}
EXPECTED_TOTAL = Decimal('1932049.27')


def load_and_validate():
    data = {name: json.loads((BACKUP / f'{name}.json').read_text(encoding='utf-8'), parse_float=Decimal)
            for name in TABLES}
    for name, rows in data.items():
        if len(rows) != EXPECTED_COUNTS[name]:
            raise ValueError(f'{name}: quantidade diferente da exportação validada')
        ids = [row['id'] for row in rows]
        if len(ids) != len(set(ids)):
            raise ValueError(f'{name}: IDs duplicados')
    for name, fields in {
        'gasto': {'obra_id': 'obra', 'categoria_id': 'categoria_gasto', 'subcategoria_id': 'subcategoria_gasto'},
        'contrato': {'obra_id': 'obra'}, 'receita': {'obra_id': 'obra', 'categoria_id': 'categoria_receita'},
        'subcategoria_gasto': {'categoria_id': 'categoria_gasto'},
        'subcategoria_gasto2': {'subcategoria_id': 'subcategoria_gasto'},
    }.items():
        for field, target in fields.items():
            valid = {row['id'] for row in data[target]}
            if any(row.get(field) and row[field] not in valid for row in data[name]):
                raise ValueError(f'{name}.{field}: referência sem cadastro no backup')
    total = sum((Decimal(str(row['valor'])) for row in data['gasto']), Decimal(0))
    if total != EXPECTED_TOTAL:
        raise ValueError('Total financeiro diferente da exportação validada')
    by_work = Counter()
    for row in data['gasto']:
        by_work[row['obra_id']] += Decimal(str(row['valor']))
    expected_by_name = {'Residencial Ipanema II': Decimal('1255571.16'),
                        'Residencial Guilhermina (3 Casas)': Decimal('676478.11'),
                        '2 Triplex Alto Padrão (Guilhermina)': Decimal('0')}
    for row in data['obra']:
        if by_work[row['id']] != expected_by_name[row['nome']]:
            raise ValueError('Total por obra diferente da exportação validada')
    return data


def sql_value(value):
    if value is None: return 'NULL'
    if isinstance(value, bool): return 'true' if value else 'false'
    if isinstance(value, (int, Decimal)): return str(value)
    if isinstance(value, list):
        return 'ARRAY[' + ','.join(sql_value(item) for item in value) + ']::text[]'
    return "'" + str(value).replace("'", "''") + "'"


def build_sql(data):
    statements = ['-- Dados financeiros: executar apenas no projeto escolhido para a migração.', 'BEGIN;']
    for name, table in TABLES.items():
        for row in data[name]:
            columns = list(row)
            if any(not key.replace('_', '').isalnum() for key in columns):
                raise ValueError('Nome de coluna inválido no backup')
            statements.append(f'INSERT INTO public.{table} ({", ".join(columns)}) VALUES '
                              f'({", ".join(sql_value(row[key]) for key in columns)}) ON CONFLICT (id) DO NOTHING;')
            # Exact exported fields must match. Existing conflicts abort the entire transaction instead of being overwritten.
            comparisons = ' AND '.join(f'{key} IS NOT DISTINCT FROM {sql_value(row[key])}' for key in columns)
            statements.append(f"DO $migration_check$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.{table} WHERE {comparisons}) "
                              f"THEN RAISE EXCEPTION 'Conflito com dados existentes em {table}; importação cancelada'; END IF; END $migration_check$;")
    gasto_ids = ','.join(sql_value(row['id']) for row in data['gasto'])
    statements.append(f"DO $migration_check$ BEGIN IF (SELECT SUM(valor) FROM public.gastos WHERE id IN ({gasto_ids})) <> {EXPECTED_TOTAL} "
                      "THEN RAISE EXCEPTION 'Total financeiro inconsistente'; END IF; END $migration_check$;")
    statements.append('COMMIT;')
    return '\n'.join(statements) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--dry-run', action='store_true')
    action.add_argument('--write-sql', type=Path, metavar='FILE')
    action.add_argument('--import', dest='import_database', action='store_true')
    args = parser.parse_args()
    data = load_and_validate()
    print('Backup validado: ' + ', '.join(f'{name}={len(rows)}' for name, rows in data.items()))
    print(f'Gastos: {EXPECTED_TOTAL:.2f}; IDs e referências preservados.')
    if args.write_sql:
        # Exclusive creation avoids overwriting an existing user file.
        with args.write_sql.open('x', encoding='utf-8') as output:
            output.write(build_sql(data))
        print('SQL transacional gerado. O arquivo contém dados da empresa; não é um arquivo público do site.')
    if args.import_database:
        import psycopg
        url = os.environ.get('SUPABASE_DB_URL')
        if not url:
            parser.error('Configure SUPABASE_DB_URL de forma segura no ambiente; não envie a senha no chat.')
        try:
            # Require certificate and hostname validation; never weaken TLS to make an import pass.
            with psycopg.connect(url, sslmode='verify-full', sslrootcert=os.environ.get('SSL_CERT_FILE', '/etc/ssl/certs/ca-certificates.crt')) as conn:
                conn.execute(build_sql(data), prepare=False)
            print('Importação concluída e conferida em uma única transação.')
        except Exception:
            # Connection exception strings may contain credentials; keep them out of logs.
            raise SystemExit('Importação falhou e não foi confirmada. Verifique acesso, certificado e compatibilidade do schema; credenciais foram omitidas.') from None


if __name__ == '__main__':
    main()
