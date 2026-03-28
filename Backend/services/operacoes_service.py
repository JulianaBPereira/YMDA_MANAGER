from ..DAO.operacoes_dao import OperacaoDAO
from datetime import date, time


class OperacaoService:
    def __init__(self, dao: OperacaoDAO):
        self.dao = dao

    def criar_operacao(
        self,
        sublinha_id: int,
        posto_id: int,
        produto_id: int,
        modelo_id: int,
        dispositivo_id: int,
        data_inicio: date,
        horario_inicio: time,
        data_fim: date = None,
        horario_fim: time = None,
    ):
        return self.dao.criar(
            sublinha_id=sublinha_id,
            posto_id=posto_id,
            produto_id=produto_id,
            modelo_id=modelo_id,
            dispositivo_id=dispositivo_id,
            data_inicio=data_inicio,
            horario_inicio=horario_inicio,
            data_fim=data_fim,
            horario_fim=horario_fim,
        )

    def buscar_operacao(self, operacao_id: int):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")
        return operacao

    def listar_operacoes(self):
        return self.dao.listar()

    def atualizar_operacao(
        self,
        operacao_id: int,
        sublinha_id: int = None,
        posto_id: int = None,
        produto_id: int = None,
        modelo_id: int = None,
        dispositivo_id: int = None,
        data_inicio: date = None,
        data_fim: date = None,
        horario_inicio: time = None,
        horario_fim: time = None,
    ):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")

        if data_inicio and data_fim and data_inicio > data_fim:
            raise ValueError("data_inicio não pode ser maior que data_fim")

        return self.dao.atualizar(
            operacao,
            sublinha_id=sublinha_id,
            posto_id=posto_id,
            produto_id=produto_id,
            modelo_id=modelo_id,
            dispositivo_id=dispositivo_id,
            data_inicio=data_inicio,
            data_fim=data_fim,
            horario_inicio=horario_inicio,
            horario_fim=horario_fim,
        )

    def deletar_operacao(self, operacao_id: int):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")
        self.dao.deletar(operacao)

    def adicionar_peca(self, operacao_id: int, peca_id: int):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")

        pecas_existentes = self.dao.listar_pecas(operacao_id)
        ids_existentes = [p.peca_id for p in pecas_existentes]
        if peca_id in ids_existentes:
            raise ValueError(f"Peça {peca_id} já está vinculada a essa operação")

        return self.dao.adicionar_peca(operacao_id, peca_id)

    def remover_peca(self, operacao_id: int, peca_id: int):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")

        pecas_existentes = self.dao.listar_pecas(operacao_id)
        ids_existentes = [p.peca_id for p in pecas_existentes]
        if peca_id not in ids_existentes:
            raise ValueError(f"Peça {peca_id} não está vinculada a essa operação")

        self.dao.remover_peca(operacao_id, peca_id)

    def listar_pecas(self, operacao_id: int):
        operacao = self.dao.buscar_por_id(operacao_id)
        if not operacao:
            raise ValueError(f"Operação {operacao_id} não encontrada")
        return self.dao.listar_pecas(operacao_id)