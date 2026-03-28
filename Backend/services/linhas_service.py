from ..Model.Linhas import Linha, Sublinha
from ..DAO.linhas_dao import LinhasDAO, SublinhasDAO


class LinhaService:
    def __init__(self, dao: LinhasDAO):
        self.dao = dao

    def criar_linha(self, nome: str) -> Linha:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome da linha não pode ser vazio.")
        return self.dao.criar_linha(nome)

    def atualizar_linha(self, linha_id: int, nome: str) -> Linha:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome da linha não pode ser vazio.")
        linha = self.dao.atualizar_linha(linha_id, nome)
        if linha is None:
            raise ValueError(f"Linha com id {linha_id} não encontrada.")
        return linha

    def deletar_linha(self, linha_id: int) -> bool:
        deletado = self.dao.deletar_linha(linha_id)
        if not deletado:
            raise ValueError(f"Linha com id {linha_id} não encontrada.")
        return True

    def listar_linhas(self) -> list[Linha]:
        return self.dao.listar()


class SublinhaService:
    def __init__(self, dao: SublinhasDAO):
        self.dao = dao

    def criar_sublinha(self, nome: str, linha_id: int) -> Sublinha:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome da sublinha não pode ser vazio.")
        if linha_id <= 0:
            raise ValueError("O linha_id deve ser um valor positivo.")
        sublinha = self.dao.criar_sublinha(nome, linha_id)
        if sublinha is None:
            raise ValueError(f"Linha com id {linha_id} não encontrada.")
        return sublinha

    def atualizar_sublinha(self, sublinha_id: int, nome: str, linha_id: int) -> Sublinha:
        nome = nome.strip()
        if not nome:
            raise ValueError("O nome da sublinha não pode ser vazio.")
        if linha_id <= 0:
            raise ValueError("O linha_id deve ser um valor positivo.")
        sublinha = self.dao.atualizar_sublinha(sublinha_id, nome, linha_id)
        if sublinha is None:
            raise ValueError(
                f"Sublinha com id {sublinha_id} ou Linha com id {linha_id} não encontrada."
            )
        return sublinha

    def deletar_sublinha(self, sublinha_id: int) -> bool:
        deletado = self.dao.deletar_sublinha(sublinha_id)
        if not deletado:
            raise ValueError(f"Sublinha com id {sublinha_id} não encontrada.")
        return True

    def listar_sublinhas(self) -> list[Sublinha]:
        return self.dao.listar()


class LinhaCompostaService:
    def __init__(self, dao: SublinhasDAO):
        self.dao = dao

    def criar_linha_com_sublinha(self, nome_linha: str, nome_sublinha: str) -> Linha:
        nome_linha = (nome_linha or "").strip()
        nome_sublinha = (nome_sublinha or "").strip()
        if not nome_linha:
            raise ValueError("O nome da linha não pode ser vazio.")
        if not nome_sublinha:
            raise ValueError("O nome da sublinha não pode ser vazio.")
        return self.dao.criar_linha_com_sublinha(nome_linha, nome_sublinha)