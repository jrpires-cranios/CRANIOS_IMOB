# Script de importação automática de imóveis do Airtable CSV
import requests
import csv
import uuid
from datetime import datetime

# Configurações
API_URL = "http://localhost:3002/api/imoveis"
CSV_FILE = "/root/cranios-backend/scripts/imoveis_airtable.csv"

HEADERS = {
    "Content-Type": "application/json"
}

print("=" * 60)
print("IMPORTACAO AUTOMATICA DE IMOVEIS (Airtable CSV)")
print("=" * 60)
print(f"API URL: {API_URL}")
print(f"CSV File: {CSV_FILE}")
print("=" * 60)

def parse_price(price_str):
    """Converte string '750,000.00' para float 750000.0"""
    if not price_str or price_str.strip() == '$0.00':
        return None
    # Remove 'R$', ',' e espaços
    clean_price = price_str.replace('R$', '').replace('.', '').replace(' ', '')
    # '750,000.00' -> '75000000' -> 750000.00
    if clean_price:
        return float(clean_price) / 100
    return 0.0

def parse_date(date_str):
    """Converte '10/11/2025' para '2025-11-10'"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        parts = date_str.split('/')
        if len(parts) == 3:
            day, month, year = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        return None

def parse_boolean(status_str):
    """'Disponivel' -> True, anything else -> False"""
    return 'Disponivel' in status_str

def importar_imoveis():
    """Importa todos os imóveis do CSV para a API"""
    print(f"\n[CSV] Lendo arquivo: {CSV_FILE}")
    
    sucesso = 0
    erros = 0
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        print(f"[CSV] Total de linhas: {len(rows)}")
        
        for i, row in enumerate(rows, 1):
            try:
                # Parse valores
                titulo = row.get('Título', '')
                tipo = row.get('Tipo', '')
                finalidade = row.get('Finalidade', '')
                bairro = row.get('Bairro', '')
                endereco = row.get('Endereço', '')
                preco_venda = parse_price(row.get('Preço Venda'))
                preco_locacao = parse_price(row.get('Preço Locação'))
                area_total = parse_price(row.get('Área Total (m2)'))
                quartos = int(row.get('Quartos', '0')) if row.get('Quartos') else 0
                suites = int(row.get('Suítes', '0')) if row.get('Suítes') else 0
                banheiros = int(row.get('Banheiros', '0')) if row.get('Banheiros') else 0
                vagas = int(row.get('Vagas', '0')) if row.get('Vagas') else 0
                descricao = row.get('Descrição', '')
                imagens = row.get('Imagens', '')
                disponivel = parse_boolean(row.get('Status', 'Disponivel'))
                data_cadastro = parse_date(row.get('Data Cadastro'))
                ultima_atualizacao = parse_date(row.get('Última Atualização', row.get('Data Cadastro')))
                proprietario_id = row.get('Proprietário', '').strip() if row.get('Proprietário') else None
                bairros = row.get('Bairros', '').strip() if row.get('Bairros') else None
                contratos = row.get('Contratos', '').strip() if row.get('Contratos') else None
                
                # Parse imagens (se tiver múltiplas URLs separadas por ';')
                fotos_urls = [url.strip() for url in imagens.split(';')] if imagens else []
                if not fotos_urls:
                    # Se campo "Imagens" estiver vazio, usar default
                    fotos_urls = ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']
                
                foto_principal = fotos_urls[0] if fotos_urls else 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
                
                # JSON Payload para API
                payload = {
                    "id": str(uuid.uuid4()),
                    "titulo": titulo,
                    "tipo": tipo,
                    "finalidade": finalidade,
                    "bairro": bairro,
                    "endereco": endereco,
                    "preco_venda": preco_venda,
                    "preco_locacao": preco_locacao,
                    "area_total": area_total,
                    "area_construida": None,
                    "quartos": quartos,
                    "suites": suites,
                    "banheiros": banheiros,
                    "vagas_garagem": vagas,
                    "caracteristicas": [],
                    "fotos": fotos_urls,
                    "foto_principal": foto_principal,
                    "disponivel": disponivel,
                    "destaque": False,
                    "cidade": "Aracaju",
                    "estado": "SE",
                    "proprietario_id": proprietario_id,
                    "created_at": data_cadastro,
                    "updated_at": ultima_atualizacao,
                }
                
                # POST para API
                response = requests.post(API_URL, json=payload, headers=HEADERS, timeout=30)
                response.raise_for_status()
                
                if response.status_code == 200 or response.status_code == 201:
                    data = response.json()
                    if data.get('success'):
                        sucesso += 1
                        print(f"[API] OK - Imóvel {i}/{len(rows)} importado: {titulo}")
                    else:
                        erros += 1
                        print(f"[API] ERRO - Imóvel {i}/{len(rows)}: {data.get('error')}")
                else:
                    erros += 1
                    print(f"[API] ERRO - Imóvel {i}/{len(rows)}: HTTP {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                erros += 1
                print(f"[API] ERRO CRÍTICO - Imóvel {i}/{len(rows)}: {e}")
            except Exception as e:
                erros += 1
                print(f"[API] ERRO - Imóvel {i}/{len(rows)}: {e}")
    
    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"✅ Importados com sucesso: {sucesso}")
    print(f"❌ Falharam: {erros}")
    print(f"📊 Total processado: {sucesso + erros}")
    print("=" * 60)

def main():
    print("=" * 60)
    print("IMPORTACAO AUTOMATICA DE IMOVEIS (AIRTABLE CSV)")
    print("=" * 60)

    try:
        importar_imoveis()
        
        print("\n" + "=" * 60)
        print("IMPORTACAO CONCLUIDA!")
        print("=" * 60)
        
        print("\nPara testar:")
        print(f"GET {API_URL}")
        print(f"GET {API_URL}/destaque?limit=5")
        print(f"GET {API_URL}/search?q=Atalaia")
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("ERRO FATAL NA IMPORTACAO")
        print("=" * 60)
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
