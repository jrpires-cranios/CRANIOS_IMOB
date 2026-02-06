# Script final para baixar imóveis do Airtable
# URL HARDCODED COM TABLE ID (conforme sua especificação)
import requests
import csv
import sys

# Configurações
API_TOKEN = "patqdpRXIkKV2kCQq.8793c795b1b74a3bb42e168606f4634245eeee593004255cd94db1bd934691a"
BASE_URL = "https://api.airtable.com/v0/tbl2dUohZqqA2aKAL/Imóveis"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}"
}

print("=" * 60)
print("BAIXANDO TABELA DO AIRTABLE: Imóveis")
print("=" * 60)
print("Token: Cranios-Imob-2")
print("URL: (Table ID)")
print("=" * 60)

def baixar_tabela_airtable():
    """
    Baixa todos os registros da tabela do Airtable via API
    """
    records = []
    
    print("\n[API] Buscando tabela Imóveis no Airtable...")
    
    try:
        response = requests.get(BASE_URL, headers=HEADERS)
        response.raise_for_status()
        
        data = response.json()
        
        if "records" not in data or len(data["records"]) == 0:
            print("[API] Nenhum registro encontrado")
            return records
        
        records.extend(data["records"])
        print(f"[API] Total de registros baixados: {len(records)}")
        return records
        
    except requests.exceptions.RequestException as e:
        print(f"[API] Erro na requisição: {e}")
        sys.exit(1)

def criar_csv(records):
    """
    Cria arquivo CSV com os registros do Airtable
    """
    print("\n[CSV] Criando arquivo: imoveis_airtable.csv")
    
    # Descobre todas as colunas dinamicamente
    fields = set()
    for r in records:
        if "fields" in r:
            fields.update(r["fields"].keys())
    
    fields = list(fields)
    print(f"[CSV] Colunas encontradas: {len(fields)}")
    
    # Ordena campos (priorizar id, titulo, tipo, etc.)
    campos_prioritarios = ['id', 'titulo', 'tipo', 'finalidade', 'bairro', 'endereco', 'preco_venda', 'preco_locacao', 'area_total', 'area_construida', 'quartos', 'suites', 'banheiros', 'vagas', 'descricao', 'imagens_urls', 'status', 'data_cadastro', 'ultima_atualizacao', 'proprietario_id']
    
    # Reordena campos
    campos_ordenados = []
    for campo in campos_prioritarios:
        if campo in fields:
            campos_ordenados.append(campo)
            fields.remove(campo)
    
    campos_ordenados.extend(fields)
    
    # Cria CSV
    csv_filename = "imoveis_airtable.csv"
    print(f"[CSV] Criando arquivo: {csv_filename}")
    
    try:
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=campos_ordenados)
            writer.writeheader()
            
            for i, r in enumerate(records):
                if "fields" in r:
                    # Extrai dados principais
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
    print("BAIXANDO TABELA DO AIRTABLE (TODOS OS IMÓVEIS)")
    print("=" * 60)

    try:
        # 1. Baixar tabela do Airtable
        records = baixar_tabela_airtable()
        
        # 2. Criar CSV
        criar_csv(records)
        
        print("\n" + "=" * 60)
        print("✅ BAIXA DA AIRTABLE CONCLUÍDA!")
        print("=" * 60)
        print(f"Total de registros: {len(records)}")
        print(f"Arquivo: imoveis_airtable.csv")
        print("=" * 60)
        print("✅ imoveis_airtable.csv gerado com sucesso!")
        print("=" * 60)
        
        print("\nPara importar no Supabase:")
        print("1. Copie o arquivo imoveis_airtable.csv")
        print("2. Execute o script de importação (próximo passo)")
        
    except Exception as error:
        print("\n" + "=" * 60)
        print("❌ ERRO FATAL NA BAIXA")
        print("=" * 60)
        print("Error:", error)
        sys.exit(1)

if __name__ == "__main__":
    main()
