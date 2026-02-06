# Script final para baixar imóveis do Airtable
# Encoding fix + Table ID + Pagination
import requests
import csv
from urllib.parse import quote

# Configurações
API_TOKEN = "patqdpRXIkKV2kCQq.8793c795b1b74a3bb42e168606f4634245eeee593004255cd94db1bd934691a"
BASE_ID = "appioL8DRw617dV6H"
TABLE_NAME = quote("Imóveis")
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}"
}

print("=" * 60)
print("BAIXANDO TABELA DO AIRTABLE: Imóveis")
print("=" * 60)
print(f"Token: Cranios-Imob-2")
print(f"Base ID: {BASE_ID}")
print(f"Table Name: {TABLE_NAME}")
print(f"URL: {BASE_URL}")
print("=" * 60)

def baixar_tabela_airtable():
    """
    Baixa todos os registros da tabela do Airtable via API (com paginação)
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
            print(f"[API] Baixados {len(records)} registros até agora...")
            
            # Paginação: verifica offset
            if "offset" in data:
                params["offset"] = data["offset"]
            else:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"[API] Erro na requisição: {e}")
            break
    
    print(f"\n[API] Total de registros baixados: {len(records)}")
    return records

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
    
    # Ordena campos (id, titulo, tipo, etc. são prioritários)
    campos_prioritarios = ['id', 'titulo', 'tipo', 'finalidade', 'bairro', 'endereco', 'preco_venda', 'preco_locacao', 'area_total', 'area_construida', 'quartos', 'suites', 'banheiros', 'vagas', 'descricao', 'imagens_urls', 'status', 'data_cadastro', 'ultima_atualizacao', 'proprietario_id', 'cidade', 'estado']
    
    # Remove duplicatas e adiciona campos prioritários
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
                    row = {}
                    # Mapeia campos Airtable para campos padrão
                    for campo_origem in r["fields"]:
                        valor = r["fields"][campo_origem]
                        row[campo_origem] = valor
                    
                    writer.writerow(row)
                    
                    if i % 10 == 0:
                        print(f"[CSV] {i}/{len(records)} registros escritos...")
        
        print(f"[CSV] Arquivo criado com sucesso!")
        print(f"[CSV] Total de registros: {len(records)}")
        
    except Exception as e:
        print(f"[CSV] Erro ao criar arquivo CSV: {e}")
        exit(1)

def main():
    print("=" * 60)
    print("🚀 BAIXANDO TABELA DO AIRTABLE (Imóveis)")
    print("=" * 60)

    try:
        # 1. Baixar tabela do Airtable
        records = baixar_tabela_airtable()
        
        # 2. Criar CSV
        criar_csv(records)
        
        print("\n" + "=" * 60)
        print("✅ BAIXA CONCLUÍDA!")
        print("=" * 60)
        print(f"Arquivo: imoveis_airtable.csv")
        print(f"Total de registros: {len(records)}")
        print("=" * 60)
        print("✅ imoveis_airtable.csv gerado com sucesso!")
        print("=" * 60)
        
        print("\nPara importar no Supabase:")
        print("1. Copie o arquivo imoveis_airtable.csv")
        print("2. Execute o script de importação (próximo passo)")
        
    except Exception as error:
        print("\n" + "=" * 60)
        print("❌ ERRO NA BAIXA DO AIRTABLE")
        print("=" * 60)
        print("Error:", error)
        exit(1)

if __name__ == "__main__":
    main()
