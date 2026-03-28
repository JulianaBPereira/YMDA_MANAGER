from sqlalchemy.orm import Session, joinedload
from ..Model.Linhas import Linha, Sublinha


class LinhasDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar_linha(self, nome: str):
        # validar duplicidade por nome (exato)
        existente = self.db.query(Linha).filter(Linha.nome == nome).first()
        if existente:
            raise ValueError("Já existe uma linha com este nome.")
        try:
            novo = Linha(nome=nome)
            self.db.add(novo)
            self.db.commit()
            self.db.refresh(novo)
            return novo
        except:
            self.db.rollback()
            raise

    def atualizar_linha(self, linha_id: int, nome: str):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return None

        # checar duplicidade com outras linhas
        conflito = (
            self.db.query(Linha)
            .filter(Linha.nome == nome, Linha.id != linha_id)
            .first()
        )
        if conflito:
            raise ValueError("Já existe outra linha com este nome.")

        try:
            linha.nome = nome
            self.db.commit()
            self.db.refresh(linha)
            return linha
        except:
            self.db.rollback()
            raise

    def deletar_linha(self, linha_id: int):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return False

        try:
            self.db.delete(linha)
            self.db.commit()
            return True
        except:
            self.db.rollback()
            raise

    def listar(self):
        return self.db.query(Linha).options(
            joinedload(Linha.sublinhas)
        ).all()


class SublinhasDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar_sublinha(self, nome: str, linha_id: int):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return None

        # validar duplicidade: mesmo nome dentro da mesma linha
        existente = (
            self.db.query(Sublinha)
            .filter(Sublinha.linha_id == linha_id, Sublinha.nome == nome)
            .first()
        )
        if existente:
            raise ValueError("Já existe uma sublinha com este nome nesta linha.")

        try:
            nova = Sublinha(nome=nome, linha_id=linha_id)
            self.db.add(nova)
            self.db.commit()
            self.db.refresh(nova)
            return nova
        except:
            self.db.rollback()
            raise

    def criar_linha_com_sublinha(self, nome_linha: str, nome_sublinha: str):
        try:
            # Se a linha já existir, anexar a sublinha a ela (se não for duplicada)
            linha = self.db.query(Linha).filter(Linha.nome == nome_linha).first()
            if linha:
                sub_existente = (
                    self.db.query(Sublinha)
                    .filter(Sublinha.linha_id == linha.id, Sublinha.nome == nome_sublinha)
                    .first()
                )
                if sub_existente:
                    raise ValueError("Já existe uma linha e sublinha cadastrada com esses nomes.")

                nova_sublinha = Sublinha(nome=nome_sublinha, linha_id=linha.id)
                self.db.add(nova_sublinha)
                self.db.commit()
                # garantir que retorne a linha com as sublinhas atualizadas
                self.db.refresh(linha)
                _ = linha.sublinhas
                return linha

            # Caso contrário, criar a linha e a sublinha
            nova_linha = Linha(nome=nome_linha)
            self.db.add(nova_linha)
            self.db.flush()

            nova_sublinha = Sublinha(nome=nome_sublinha, linha_id=nova_linha.id)
            self.db.add(nova_sublinha)

            self.db.commit()
            self.db.refresh(nova_linha)
            _ = nova_linha.sublinhas
            return nova_linha
        except:
            self.db.rollback()
            raise

    def atualizar_sublinha(self, sublinha_id: int, nome: str, linha_id: int):
        sublinha = self.db.query(Sublinha).filter(Sublinha.id == sublinha_id).first()

        if not sublinha:
            return None

        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()
        if not linha:
            return None

        # checar duplicidade na mesma linha com outros ids
        conflito = (
            self.db.query(Sublinha)
            .filter(
                Sublinha.linha_id == linha_id,
                Sublinha.nome == nome,
                Sublinha.id != sublinha_id
            )
            .first()
        )
        if conflito:
            raise ValueError("Já existe outra sublinha com este nome nesta linha.")

        try:
            sublinha.nome = nome
            sublinha.linha_id = linha_id
            self.db.commit()
            self.db.refresh(sublinha)
            return sublinha
        except:
            self.db.rollback()
            raise

    def deletar_sublinha(self, sublinha_id: int):
        sublinha = self.db.query(Sublinha).filter(Sublinha.id == sublinha_id).first()

        if not sublinha:
            return False

        try:
            self.db.delete(sublinha)
            self.db.commit()
            return True
        except:
            self.db.rollback()
            raise

    def listar(self):
        return self.db.query(Sublinha).options(
            joinedload(Sublinha.linha)
        ).all()