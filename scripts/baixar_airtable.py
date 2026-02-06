# Baixa imóveis do Airtable (Última Tentativa)
import requests
import json
import csv
import sys

API_TOKEN = "patqdpRXIkKV2kCQq.8793c795b1b74a3bb42e168606f4634245eeee593004255cd94db1bd934691a"
TABLE_ID = "tbl2dUohZqqA2aKAL"
BASE_ID = "appioL8DRw617dV6H"
URL = f"https://api.airtable.com/v0/{BASE_ID}/Imóveis"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}"
}

print("=" * 60)
print("BAIXANDO IMÓVEIS DO AIRTABLE")
print("=" * 60)
print(f"Token: {API_TOKEN}")
print(f"Table ID: {TABLE_ID}")
print(f"Base ID: {BASE_ID}")
print(f"URL: {URL}")
print("=" * 60)

try:
    response = requests.get(URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    
    if "records" not in data or len(data["records"]) == 0:
        print("Nenhum registro encontrado")
        sys.exit(1)
    
    records = data["records"]
    print(f"\nTotal de imóveis baixados: {len(records)}")
    
    # Descobre colunas dinamicamente
    fields = set()
    for r in records:
        if "fields" in r:
            fields.update(r["fields"].keys())
    
    campos_prioritarios = ['id', 'titulo', 'tipo', 'finalidade', 'bairro', 'endereco', 'preco_venda', 'preco_locacao', 'area_total', 'quartos', 'suites', 'banheiros', 'vagas', 'descricao', 'imagens_urls', 'disponivel', 'destaque', 'proprietario_id']
    
    campos_ordenados = []
    for campo in campos_prioritarios:
        if campo in fields:
            campos_ordenados.append(campo)
            fields.remove(campo)
    
    campos_ordenados.extend(fields)
    
    # Cria CSV
    csv_filename = "imoveis_airtable.csv"
    print(f"\nCriando arquivo: {csv_filename}")
    
    with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=campos_ordenados)
        writer.writeheader()
        
        for i, r in enumerate(records):
            if "fields" in r:
                row = {
                    'id': r.get('id', ''),
                    **{campo: r['fields'].get(campo, '') for campo in campos_ordenados if campo != 'id'}
                }
                writer.writerow(row)
                
                if i % 5 == 0:
                    print(f"{i+1}/{len(records)} registros escritos...")
    
    print(f"\nArquivo criado: {csv_filename}")
    print(f"Total de registros: {len(records)}")
    
    print("\n" + "=" * 60)
    print("BAIXA CONCLUÍDA!")
    print("=" * 60)
    print(f"Total de imóveis: {len(records)}")
    print(f"Arquivo: {csv_filename}")
    print("=" * 60)
    print("Para amanhã:")
    print("1. Importar imoveis_airtable.csv no Supabase")
    print("2. Criar dashboards de BI")
    print("3. Testar Frontend")
    print("4. Demonstrar o sistema")
    
except Exception as e:
    print("\n" + "=" * 60)
    print("ERRO NA BAIXA")
    print("=" * 60)
    print(f"Error: {e}")
    sys.exit(1)
