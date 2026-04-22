# Script de importação automática do Airtable CSV (29 imóveis)
import requests
import csv
import sys
import uuid
from datetime import datetime

# Configurações
API_URL = "http://localhost:3002/api/imoveis"
CSV_FILE = "/root/cranios-backend/scripts/imoveis_airtable_final.csv"

HEADERS = {
    "Content-Type": "application/json"
}

# Funções de Parsing
def parse_money(value_str):
    """Converte '750,000.00' para 750000.0"""
    if not value_str or value_str.strip() == '':
        return 0.0
    # Remove 'R$', '.' e espaços
    clean = value_str.replace('R$', '').replace('.', '').replace(' ', '')
    # '750,000.00' -> '75000000'
    try:
        if clean:
            return float(clean) / 100.0
    except:
        return 0.0

def parse_int(value_str):
    """Converte '96' para 96"""
    try:
        return int(value_str) if value_str and value_str.strip() != '' else 0
    except:
        return 0

def parse_date_br(value_str):
    """Converte '10/11/2025' para '2025-11-10'"""
    if not value_str or value_str.strip() == '':
        return None
    try:
        parts = value_str.split('/')
        if len(parts) == 3:
            return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
    except:
        return None

def parse_boolean(value_str):
    """'Disponivel' -> True"""
    return 'Disponivel' in value_str

def parse_imagens(value_str):
    """'url1;url2' -> ['url1', 'url2']"""
    if not value_str or value_str.strip() == '':
        return ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']
    return [url.strip() for url in value_str.split(';')]

def main():
    print("=" * 60)
    print("IMPORTAÇÃO AUTOMÁTICA DE IMÓVEIS (Airtable CSV)")
    print("=" * 60)
    print(f"API URL: {API_URL}")
    print(f"CSV File: {CSV_FILE}")
    print("=" * 60)

    # 1. Ler CSV
    print(f"\n[CSV] Lendo arquivo...")
    
    records = []
    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            # Ignora cabeçalho
            if len(rows) > 0 and 'id' in rows[0]:
                records = rows
            
        print(f"[CSV] Total de imóveis: {len(records)}")
    except Exception as e:
        print(f"[CSV] Erro ao ler CSV: {e}")
        sys.exit(1)

    # 2. Importar para API
    print(f"\n[API] Importando imóveis para a API...")
    
    sucesso = 0
    erros = 0
    
    for i, row in enumerate(records, 1):
        try:
            # Parsear dados
            id_imovel = row.get('id', '')
            titulo = row.get('titulo', '')
            tipo = row.get('tipo', '')
            finalidade = row.get('finalidade', '')
            bairro = row.get('bairro', '')
            endereco = row.get('endereco', '')
            preco_venda = parse_money(row.get('preco_venda', ''))
            preco_locacao = parse_money(row.get('preco_locacao', ''))
            area_total = parse_money(row.get('area_total_m2', ''))
            quartos = parse_int(row.get('quartos', ''))
            suites = parse_int(row.get('suites', ''))
            banheiros = parse_int(row.get('banheiros', ''))
            vagas = parse_int(row.get('vagas', ''))
            descricao = row.get('descricao', '')
            fotos = parse_imagens(row.get('imagens', ''))
            status = parse_boolean(row.get('status', ''))
            data_cadastro = parse_date_br(row.get('data_cadastro', ''))
            ultima_atualizacao = parse_date_br(row.get('ultima_atualizacao', ''))
            proprietario_id = row.get('proprietario', '').strip() if row.get('proprietario') else None
            cidade = 'Aracaju'
            estado = 'SE'
            
            # Payload JSON
            payload = {
                "id": id_imovel,
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
                "fotos": fotos,
                "foto_principal": fotos[0] if fotos else 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
                "disponivel": status,
                "destaque": True,
                "cidade": cidade,
                "estado": estado,
                "proprietario_id": proprietario_id if proprietario_id != '' else None,
                "created_at": data_cadastro,
                "updated_at": ultima_atualizacao,
            }
            
            # POST para API
            response = requests.post(API_URL, json=payload, headers=HEADERS, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('success'):
                sucesso += 1
                print(f"[API] OK - Imóvel {i}/{len(rows)} importado: {titulo}")
            else:
                erros += 1
                print(f"[API] ERRO - Imóvel {i}/{len(rows)}: {data.get('error')}")
                
        except requests.exceptions.RequestException as e:
            erros += 1
            print(f"[API] ERRO CRÍTICO - Imóvel {i}/{len(rows)}: {e}")
        except Exception as e:
            erros += 1
            print(f"[API] ERRO - Imóvel {i}/{len(rows)}: {e}")
    
    # 3. Resultado Final
    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"✅ Importados com sucesso: {sucesso}")
    print(f"❌ Falharam: {erros}")
    print(f"📊 Total processado: {sucesso + erros}")
    print("=" * 60)
    print("\nPara testar:")
    print(f"GET {API_URL}")
    print(f"GET {API_URL}/destaque?limit=5")
    print(f"GET {API_URL}/search?q=Atalaia")
    
if __name__ == "__main__":
    main()
