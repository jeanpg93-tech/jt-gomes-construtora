#!/usr/bin/env python3
"""Prepare a complete private Base44 snapshot for transactional import.

Auth profiles and records with broken relationships stay in a private archive.
The SQL is for a reviewed rehearsal until reconciliation and Auth setup finish.
"""
import argparse
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

from import_data import sql_value

PROJECT = Path(__file__).resolve().parent.parent
SCHEMA = PROJECT / 'supabase/migrations/202610020001_base44_to_supabase.sql'
APP_ID = '68e9048368479eb97b630e22'
# Parents precede children. User is archived separately, never inserted into Auth.
TABLES = {
    'Obra': 'obras', 'CategoriaGasto': 'categorias_gasto',
    'SubcategoriaGasto': 'subcategorias_gasto', 'SubcategoriaGasto2': 'subcategorias_gasto2',
    'CategoriaReceita': 'categorias_receita', 'Fornecedor': 'fornecedores',
    'Pessoa': 'pessoas', 'EtapaObra': 'etapas_obra', 'Material': 'materiais',
    'MaterialEtapa': 'materiais_etapas', 'CategoriaGastoAdministrativo': 'categorias_gasto_administrativo',
    'Gasto': 'gastos', 'Receita': 'receitas', 'Contrato': 'contratos',
    'ParcelaGasto': 'parcelas_gasto', 'GastoAdministrativo': 'gastos_administrativos',
    'Recibo': 'recibos', 'SolicitacaoCadastro': 'solicitacoes_cadastro',
}
METADATA = {'created_by_id', 'is_sample'}


def invalid_number(_):
    raise ValueError('Número não finito no snapshot')


def json_text(value):
    """Encode JSON decimals as numbers, without rounding them to binary floats."""
    if value is None: return 'null'
    if isinstance(value, bool): return 'true' if value else 'false'
    if isinstance(value, (int, Decimal)):
        if isinstance(value, Decimal) and not value.is_finite():
            raise ValueError('Número não finito no snapshot')
        return str(value)
    if isinstance(value, str): return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list): return '[' + ','.join(json_text(v) for v in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json_text(k) + ':' + json_text(value[k]) for k in sorted(value)) + '}'
    raise ValueError('Tipo JSON não suportado')


def load_snapshot(directory):
    directory = Path(directory).resolve()
    manifest_bytes = (directory / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    if manifest.get('app_id') != APP_ID:
        raise ValueError('O manifesto não corresponde ao aplicativo de origem confirmado')
    expected = set(TABLES) | {'User'}
    if set(manifest.get('entities', {})) != expected:
        raise ValueError('O manifesto precisa cobrir todas as 19 entidades esperadas')
    records = {}
    for entity in sorted(expected):
        info = manifest['entities'][entity]
        if info['file'] != entity + '.json':
            raise ValueError('Nome de arquivo inesperado no manifesto')
        path = directory / info['file']
        if path.is_symlink(): raise ValueError('Links simbólicos não são aceitos no snapshot')
        contents = path.read_bytes()
        if hashlib.sha256(contents).hexdigest() != info['sha256']:
            raise ValueError(f'{entity}: checksum diferente do manifesto')
        rows = json.loads(contents, parse_float=Decimal, parse_constant=invalid_number)
        if not isinstance(rows, list) or len(rows) != info['count']:
            raise ValueError(f'{entity}: contagem diferente do manifesto')
        ids = []
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id']:
                raise ValueError(f'{entity}: registro sem ID válido')
            ids.append(row['id'])
        if len(set(ids)) != len(ids): raise ValueError(f'{entity}: IDs duplicados')
        records[entity] = rows
    return manifest, hashlib.sha256(manifest_bytes).hexdigest(), records


def prepare(directory):
    manifest, snapshot_id, raw = load_snapshot(directory)
    schema = SCHEMA.read_text()
    columns = {}
    for entity, table in TABLES.items():
        block = re.search(r'CREATE TABLE public\.' + table + r' \((.*?)\n\);', schema, re.S)
        if not block: raise ValueError('Tabela de destino não encontrada no schema revisado')
        columns[entity] = dict(re.findall(r'^  ([a-z_][a-z0-9_]*) (.+)', block[1], re.M))
    references = re.findall(r'ALTER TABLE public\.(\w+) ADD FOREIGN KEY \((\w+)\) REFERENCES public\.(\w+)\(id\)', schema)
    entity_for_table = {table: entity for entity, table in TABLES.items()}
    foreign_keys = {entity: {} for entity in TABLES}
    for table, field, target in references:
        if table in entity_for_table and target in entity_for_table:
            foreign_keys[entity_for_table[table]][field] = entity_for_table[target]
    array_keys = {'Gasto': {'etapa_obra_ids': 'EtapaObra'}, 'Contrato': {'contratados_ids': 'Fornecedor'}}
    ids = {entity: {row['id'] for row in rows} for entity, rows in raw.items()}
    normalized, problems, warnings, normalizations = {}, {}, [], Counter()
    for entity, table in TABLES.items():
        normalized[entity] = []
        for original in raw[entity]:
            unknown = set(original) - set(columns[entity]) - METADATA
            if unknown: raise ValueError(f'{entity}: campos sem destino no schema: {sorted(unknown)}')
            row = {key: value for key, value in original.items() if key not in METADATA}
            issues = []
            for key, definition in columns[entity].items():
                value = row.get(key)
                if value == '' and (not definition.startswith('text') or 'CHECK' in definition or key in foreign_keys[entity]):
                    row[key] = value = None
                    normalizations[entity + '.' + key] += 1
                if value is None and 'NOT NULL' in definition and 'DEFAULT' not in definition:
                    issues.append({'field': key, 'reason': 'required_value_missing'})
                if value is not None and definition.startswith('numeric(18,2)'):
                    amount = Decimal(str(value))
                    if not amount.is_finite() or amount != amount.quantize(Decimal('0.01')) or abs(amount) >= Decimal('1e16'):
                        raise ValueError(f'{entity}.{key}: valor fora da precisão do destino')
            if entity == 'Fornecedor' and row.get('tipo') is None:
                row['tipo'] = None
                warnings.append({'entity': entity, 'source_id': row['id'], 'reason': 'supplier_type_missing'})
            for field, target in foreign_keys[entity].items():
                value = row.get(field)
                if value is not None and value not in ids[target]:
                    issues.append({'field': field, 'reason': 'parent_missing', 'target_entity': target, 'target_id': value})
            for field, target in array_keys.get(entity, {}).items():
                values = row.get(field) or []
                if not isinstance(values, list): raise ValueError(f'{entity}.{field}: lista esperada')
                for value in values:
                    if value not in ids[target]:
                        issues.append({'field': field, 'reason': 'parent_missing', 'target_entity': target, 'target_id': value})
            normalized[entity].append(row)
            if issues: problems[(entity, row['id'])] = issues
    # Exclude dependents of a quarantined parent too: never let a partial load break FKs.
    changed = True
    while changed:
        changed = False
        for entity, rows in normalized.items():
            for row in rows:
                key = entity, row['id']
                if key in problems: continue
                issues = []
                for field, target in foreign_keys[entity].items():
                    if (target, row.get(field)) in problems:
                        issues.append({'field': field, 'reason': 'parent_reconciliation_pending', 'target_entity': target})
                for field, target in array_keys.get(entity, {}).items():
                    if any((target, value) in problems for value in (row.get(field) or [])):
                        issues.append({'field': field, 'reason': 'parent_reconciliation_pending', 'target_entity': target})
                if issues: problems[key] = issues; changed = True
    # Auth identity/configuration is preserved, never converted into live privileges.
    allowed_user_fields = set(re.findall(r'^  ([a-z_][a-z0-9_]*) ', re.search(r'CREATE TABLE public\.profiles \((.*?)\n\);', schema, re.S)[1], re.M))
    if any(set(row) - allowed_user_fields for row in raw['User']):
        raise ValueError('Campos de usuário fora da seleção de perfil permitida')
    live = {entity: [row for row in rows if (entity, row['id']) not in problems] for entity, rows in normalized.items()}
    report = {'snapshot_id': snapshot_id, 'app_id': manifest['app_id'],
              'source_counts': {entity: len(rows) for entity, rows in raw.items()},
              'operational_counts': {TABLES[entity]: len(rows) for entity, rows in live.items()},
              'archived_records': sum(len(rows) for rows in raw.values()),
              'auth_profiles_pending': len(raw['User']), 'reconciliation_records': len(problems),
              'warnings': dict(Counter(item['reason'] for item in warnings)),
              'empty_fields_normalized_to_null': dict(normalizations), 'totals': {}}
    for entity in ['Gasto', 'GastoAdministrativo', 'ParcelaGasto', 'Recibo']:
        report['totals'][TABLES[entity]] = {
            'source': str(sum((Decimal(str(row.get('valor') or 0)) for row in raw[entity]), Decimal(0))),
            'operational': str(sum((Decimal(str(row.get('valor') or 0)) for row in live[entity]), Decimal(0)))}
    return {'manifest': manifest, 'snapshot_id': snapshot_id, 'raw': raw, 'live': live,
            'problems': problems, 'warnings': warnings, 'report': report}


def insert_checked(table, row, casts=None):
    casts = casts or {}
    values = {key: sql_value(value) + casts.get(key, '') for key, value in row.items()}
    return [f'INSERT INTO {table} ({", ".join(row)}) VALUES ({", ".join(values.values())}) ON CONFLICT DO NOTHING;',
            'SELECT migration_private.assert_record(EXISTS (SELECT 1 FROM ' + table + ' WHERE ' +
            ' AND '.join(f'{key} IS NOT DISTINCT FROM {value}' for key, value in values.items()) + '));']


def build_sql(prepared, *, allow_reconciliation=False):
    if prepared['problems'] and not allow_reconciliation:
        raise ValueError('Há registros sem conciliação; use --allow-reconciliation somente para preparar carga de ensaio com arquivo privado')
    statements = ['-- Dados privados. Carga de ensaio; não publicar como asset.',
                  'BEGIN;', 'SET LOCAL standard_conforming_strings = on;']
    snapshot_id = prepared['snapshot_id']
    statements += insert_checked('migration_private.snapshots', {
        'id': snapshot_id, 'app_id': prepared['manifest']['app_id'],
        'manifest': json_text(prepared['manifest'])}, {'manifest': '::jsonb'})
    for entity, rows in prepared['raw'].items():
        for row in rows:
            issues = prepared['problems'].get((entity, row['id']), [])
            disposition = 'auth_pending' if entity == 'User' else 'reconcile' if issues else 'imported'
            statements += insert_checked('migration_private.source_records', {
                'snapshot_id': snapshot_id, 'entity': entity, 'source_id': row['id'],
                'raw_record': json_text(row), 'disposition': disposition,
                'issues': json_text(issues)}, {'raw_record': '::jsonb', 'issues': '::jsonb'})
    for entity, table in TABLES.items():
        for row in prepared['live'][entity]: statements += insert_checked('public.' + table, row)
    statements.append('COMMIT;')
    return '\n'.join(statements) + '\n'


def private_output(path, contents):
    path = Path(path).resolve()
    if path == PROJECT or PROJECT in path.parents:
        raise ValueError('Arquivos com dados da origem devem ficar fora do repositório do frontend')
    with path.open('x', encoding='utf-8') as file:
        path.chmod(0o600)
        file.write(contents)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot_directory', type=Path)
    parser.add_argument('--write-sql', type=Path)
    parser.add_argument('--write-report', type=Path)
    parser.add_argument('--allow-reconciliation', action='store_true')
    args = parser.parse_args()
    prepared = prepare(args.snapshot_directory)
    print(json.dumps(prepared['report'], indent=2))
    if args.write_report: private_output(args.write_report, json.dumps(prepared['report'], indent=2) + '\n')
    if args.write_sql: private_output(args.write_sql, build_sql(prepared, allow_reconciliation=args.allow_reconciliation))
    if prepared['problems'] and not args.allow_reconciliation:
        raise SystemExit('Conciliação pendente. Nenhuma importação foi executada.')


if __name__ == '__main__': main()
