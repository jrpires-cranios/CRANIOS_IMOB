# Script para baixar imóveis do Airtable
# Token: patqdpRXIkKV2kCQq.8793c795b1b74a3bb42e168606f4634245eeee593004255cd94db1bd934691a
# Base ID: appioL8DRw617dV6H
# Tabela: Imóveis

import requests
import csv
import sys

# Configurações
API_TOKEN = "patqdpRXIkKV2kCQq.8793c795b1b74a3bb42e168606f4634245eeee593004255cd94db1bd934691a"
BASE_ID = "appioL8DRw617dV6H"
TABLE_NAME = "Imóveis"
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}"
}

print("=" * 60)
print(f"BAIXANDO TABELA DO AIRTABLE: {TABLE_NAME}")
print("=" * 60)
print(f"Token: Cranios-Imob-2")
print(f"Base ID: {BASE_ID}")
print(f"URL: {BASE_URL}")
print("=" * 60)

def baixar_tabela_airtable():
    """
    Baixa todos os registros da tabela do Airtable via API
    """
    records = []
    params = {}
    
    print(f"\n[API] Buscando tabela {TABLE_NAME} no Airtable...")
    
    while True:
        try:
            response = requests.get(BASE_URL, headers=HEADERS, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if "records" not in data or len(data["records"]) == 0:
                print(f"[API] Nenhum registro encontrado")
                break
            
            records.extend(data["records"])
            
            # Descobre todas as colunas
            if "offset" in data:
                params["offset"] = data["offset"]
            else:
                break
                
            print(f"[API] Baixados {len(records)} registros até agora...")
            
        except requests.exceptions.RequestException as e:
            print(f"[API] Erro na requisição: {e}")
            sys.exit(1)
    
    print(f"\n[API] Total de registros baixados: {len(records)}")
    return records

def criar_csv(records):
    """
    Cria arquivo CSV com os registros do Airtable
    """
    # Descobre todas as colunas
    fields = set()
    for r in records:
        if "fields" in r:
            fields.update(r["fields"].keys())
    
    fields = list(fields)
    print(f"\n[CSV] Colunas encontradas: {len(fields)}")
    
    # Ordenar campos (priorizar id, titulo, tipo, etc.)
    campos_prioritarios = ['id', 'titulo', 'tipo', 'finalidade', 'bairro', 'endereco', 'preco_venda', 'preco_locacao', 'area_total', 'area_construida', 'quartos', 'suites', 'banheiros', 'vagas', 'descricao', 'imagens_urls', 'status', 'data_cadastro', 'ultima_atualizacao', 'proprietario_id']
    
    # Reordenar campos
    campos_ordenados = []
    for campo in campos_prioritarios:
        if campo in fields:
            campos_ordenados.append(campo)
            fields.remove(campo)
    
    campos_ordenados.extend(fields)
    
    # Cria CSV
    csv_filename = "imoveis_airtable_completo.csv"
    print(f"[CSV] Criando arquivo: {csv_filename}")
    
    try:
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=campos_ordenados)
            writer.writeheader()
            
            for i, r in enumerate(records, 1):
                if "fields" in r:
                    # Dados principais
                    row = {
                        'id': r.get('id', ''),
                        'titulo': r.get('fields', {}).get('titulo', ''),
                        'tipo': r.get('fields', {}).get('tipo', ''),
                        'finalidade': r.get('fields', {}).get('finalidade', ''),
                        'bairro': r.get('fields', {}).get('bairro', ''),
                        'endereco': r.get('fields', {}).get('endereco', ''),
                        'preco_venda': r.get('fields', {}).get('preco_venda', ''),
                        'preco_locacao': r.get('fields', {}).get('preco_locacao', ''),
                        'area_total': r.get('fields', {}).get('area_total', ''),
                        'area_construida': r.get('fields', {}).get('area_construida', ''),
                        'quartos': r.get('fields', {}).get('quartos', ''),
                        'suites': r.get('fields', {}).get('suites', ''),
                        'banheiros': r.get('fields', {}).get('banheiros', ''),
                        'vagas': r.get('fields', {}).get('vagas', ''),
                        'descricao': r.get('fields', {}).get('descricao', ''),
                        'imagens_urls': r.get('fields', {}).get('imagens_urls', ''),
                        'status': r.get('fields', {}).get('status', ''),
                        'data_cadastro': r.get('fields', {}).get('data_cadastro', ''),
                        'ultima_atualizacao': r.get('fields', {}).get('ultima_atualizacao', ''),
                        'proprietario_id': r.get('fields', {}).get('proprietario_id', ''),
                        'created_time': r.get('createdTime', ''),
                        'cidade': 'Aracaju',
                        'estado': 'SE',
                    }
                    
                    writer.writerow(row)
                    
                    if i % 10 == 0:
                        print(f"[CSV] {i}/{len(records)} registros escritos...")
        
        print(f"[CSV] Arquivo criado com sucesso!")
        print(f"[CSV] Total de registros: {len(records)}")
        
    except Exception as e:
        print(f"[CSV] Erro ao criar arquivo CSV: {e}")
        sys.exit(1)

def main():
    print("=" * 60)
    print("🚀 BAIXANDO TABELA DO AIRTABLE (TODOS OS IMÓVEIS)")
    print("=" * 60)
    
    try:
        # 1. Baixar tabela do Airtable
        records = baixar_tabela_airtable()
        
        # 2. Criar CSV
        criar_csv(records)
        
        print("\n" + "=" * 60)
        print("✅ BAIXA DO AIRTABLE CONCLUÍDA!")
        print("=" * 60)
        print("Arquivo gerado: imoveis_airtable_completo.csv")
        print(f"Total de registros: {len(records)}")
        print("=" * 60)
        print("✅ imoveis_airtable_completo.csv gerado com sucesso!")
        print("=" * 60)
        
        print("\nPara importar no Supabase:")
        print("1. Copie o arquivo imoveis_airtable_completo.csv")
        print("2. Execute o script de importação")
        
    except Exception as error:
        print("\n" + "=" * 60)
        print("❌ ERRO FATAL NA BAIXA DO AIRTABLE")
        print("=" * 60)
        print("Error:", error)
        sys.exit(1)

if __name__ == "__main__":
    main()
