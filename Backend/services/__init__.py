"""
Services package - Lógica de negócio
"""

from Backend.services import (
    producao_service,
    produto_service,
    rfid_service,
    csv_service,
    funcionarios_service,
    modelos_service,
    linha_service,
    sublinha_service
)


try:
    from Backend.services import excel_service
except ImportError:
    excel_service = None
    print("Aviso: openpyxl não instalado. Exportação Excel não estará disponível.")
