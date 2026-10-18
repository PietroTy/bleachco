#!/usr/bin/env python3
"""
scripts/sync_google_sheets.py
-----------------------------
Script de automação para a Bleach Co.
Puxa todas as vendas do backend da Bleach Co. e exporta automaticamente para:
1. Um arquivo CSV local (pedidos_bleachco.csv) para abertura imediata no Excel/Google Sheets.
2. Sincronização automática via Google Sheets API (gspread) direto no seu Google Sheets na nuvem.
"""

import os
import sys
import csv
import json
from datetime import datetime

# Configurações do Backend e Planilha
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDERS_FILE = os.path.join(BASE_DIR, "backend", "orders.json")
CSV_OUTPUT_FILE = os.path.join(BASE_DIR, "pedidos_bleachco.csv")
CREDENTIALS_FILE = os.path.join(BASE_DIR, "google_credentials.json")
SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1-7sqUShOjilj3BxaE3bOJUZ47yxpLwueq_5-B2o2pR4/edit"

def fetch_orders():
    """Lê os pedidos direto do orders.json do backend (mesma máquina, sem passar pela API)."""
    print(f"📦 Lendo pedidos de {ORDERS_FILE}...")
    try:
        with open(ORDERS_FILE, encoding='utf-8') as f:
            orders = json.load(f)
        print(f"✅ {len(orders)} pedido(s) encontrado(s) no backend.")
        return orders
    except Exception as e:
        print(f"⚠️ Erro ao ler pedidos: {e}")
        return []

def format_items_summary(items):
    """Formata os itens do pedido em texto simples."""
    if not items:
        return ""
    summary_parts = []
    for item in items:
        name = item.get('name', 'Camiseta')
        size = item.get('size', 'M')
        qty = item.get('qty', 1)
        summary_parts.append(f"{qty}x {name} (Tam: {size})")
    return " | ".join(summary_parts)

def build_table_data(orders):
    """Gera o cabeçalho e as linhas formatadas."""
    headers = [
        'ID do Pedido',
        'Data/Hora',
        'Status Pagamento',
        'Cliente',
        'Email',
        'Telefone',
        'CPF',
        'Endereço Completo',
        'Cidade/UF',
        'CEP',
        'Itens (Tamanhos)',
        'Frete Selecionado',
        'Valor Frete (R$)',
        'Total Pedido (R$)',
        'Status Envio'
    ]

    rows = []
    for o in orders:
        payer = o.get('payer', {})
        items_str = format_items_summary(o.get('items', []))
        shipping = o.get('shipping', {}) or {}
        
        # Endereço formatado
        rua = payer.get('rua', '')
        num = payer.get('num', '')
        comp = f" - {payer.get('comp')}" if payer.get('comp') else ""
        bairro = payer.get('bairro', '')
        endereco_fmt = f"{rua}, {num}{comp} - {bairro}".strip(" -")
        cidade_uf = f"{payer.get('cidade', '')}/{payer.get('estado', '')}"
        
        # Frete
        frete_nome = shipping.get('name', 'Padrão')
        frete_preco = f"{shipping.get('price', 0.0):.2f}".replace('.', ',')
        
        # Total
        total_val = f"{o.get('total', 0.0):.2f}".replace('.', ',')

        rows.append([
            o.get('orderId', ''),
            o.get('createdAt', ''),
            'Aprovado' if o.get('status') == 'approved' else 'Pendente',
            payer.get('nome', ''),
            payer.get('email', ''),
            payer.get('tel', ''),
            payer.get('cpf', ''),
            endereco_fmt,
            cidade_uf,
            payer.get('cep', ''),
            items_str,
            frete_nome,
            frete_preco,
            total_val,
            'A Enviar' if o.get('status') == 'approved' else 'Aguardando Pagamento'
        ])

    return headers, rows

def export_to_csv(headers, rows):
    """Exporta os pedidos para um arquivo CSV formatado."""
    with open(CSV_OUTPUT_FILE, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"📄 Arquivo CSV local atualizado com sucesso: {os.path.abspath(CSV_OUTPUT_FILE)}")

def sync_to_google_sheets(headers, rows):
    """Sincroniza com o Google Sheets direto na nuvem usando gspread."""
    try:
        import gspread
    except ImportError:
        print("💡 [Google Sheets API] Pacote 'gspread' não instalado.")
        return

    if not os.path.exists(CREDENTIALS_FILE):
        print(f"ℹ️ Arquivo '{CREDENTIALS_FILE}' não encontrado.")
        return

    try:
        print(f"📊 Sincronizando com o Google Sheets na nuvem...")
        gc = gspread.service_account(filename=CREDENTIALS_FILE)
        sh = gc.open_by_url(SPREADSHEET_URL)
        worksheet = sh.sheet1
        
        # Limpa e escreve os dados atualizados
        all_data = [headers] + rows
        worksheet.clear()
        worksheet.update(all_data, 'A1')
        print(f"✅ Sucesso! Planilha Google Sheets atualizada com {len(rows)} pedido(s).")
    except Exception as e:
        err_msg = str(e)
        print(f"⚠️ Erro ao atualizar o Google Sheets: {e}")
        if "Google Sheets API" in err_msg or "disabled" in err_msg or "403" in err_msg:
            print("👉 Falta APENAS ATIVAR a API do Google Sheets no seu projeto!")
            print("   Clique neste link direto e aperte 'ATIVAR':")
            print("   https://console.cloud.google.com/apis/library/sheets.googleapis.com")
        else:
            print("👉 Lembre-se de compartilhar a planilha com o e-mail da conta de serviço (como Editor):")
            print("   bleachco-sheets@bleachco-505001.iam.gserviceaccount.com")

def main():
    print("=" * 60)
    print(" Bleach Co. - Automação de Gestão de Vendas & Envios")
    print("=" * 60)
    
    orders = fetch_orders()
    headers, rows = build_table_data(orders)
    export_to_csv(headers, rows)
    sync_to_google_sheets(headers, rows)
    
    print("-" * 60)
    print("✨ Processo de sincronização concluído com sucesso.")

if __name__ == '__main__':
    main()
