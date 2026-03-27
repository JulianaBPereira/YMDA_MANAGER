SET TIME ZONE 'America/Manaus';

-- =========================
-- USUÁRIOS
-- =========================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role TEXT DEFAULT 'admin',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP
);

-- =========================
-- FUNCIONÁRIOS
-- =========================
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    tag VARCHAR(255) NOT NULL,
    matricula VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    tag_temporaria VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP
);

-- =========================
-- TURNOS (simples)
-- =========================
CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE funcionario_turnos (
    funcionario_id INTEGER,
    turno_id INTEGER,
    PRIMARY KEY (funcionario_id, turno_id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id),
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);

-- =========================
-- LINHAS E SUBLINHAS
-- =========================
CREATE TABLE linhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE sublinhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    linha_id INTEGER,
    FOREIGN KEY (linha_id) REFERENCES linhas(id)
);

-- =========================
-- DISPOSITIVOS (Raspberry)
-- =========================
CREATE TABLE dispositivos_raspberry (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP
);

-- =========================
-- POSTOS
-- =========================
CREATE TABLE postos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sublinha_id INTEGER NOT NULL,
    dispositivo_id INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_raspberry(id)
);

-- =========================
-- PRODUTOS / MODELOS / PEÇAS
-- =========================
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP
);

CREATE TABLE modelos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    produto_id INTEGER,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE pecas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(255) NOT NULL
);

-- relação modelo → peças
CREATE TABLE modelo_pecas (
    modelo_id INTEGER,
    peca_id INTEGER,
    PRIMARY KEY (modelo_id, peca_id),
    FOREIGN KEY (modelo_id) REFERENCES modelos(id),
    FOREIGN KEY (peca_id) REFERENCES pecas(id)
);

-- =========================
-- OPERAÇÕES
-- =========================
CREATE TABLE operacoes (
    id SERIAL PRIMARY KEY,
    sublinha_id INTEGER,
    posto_id INTEGER,
    produto_id INTEGER,
    modelo_id INTEGER,
    dispositivo_id INTEGER,
    data_inicio DATE,
    data_fim DATE,
    horario_inicio TIME,
    horario_fim TIME,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(id),
    FOREIGN KEY (posto_id) REFERENCES postos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (modelo_id) REFERENCES modelos(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_raspberry(id)
);

-- múltiplas peças por operação
CREATE TABLE operacao_pecas (
    operacao_id INTEGER,
    peca_id INTEGER,
    PRIMARY KEY (operacao_id, peca_id),
    FOREIGN KEY (operacao_id) REFERENCES operacoes(id),
    FOREIGN KEY (peca_id) REFERENCES pecas(id)
);

-- =========================
-- REGISTROS DE PRODUÇÃO
-- =========================
CREATE TABLE registros_producao (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER,
    operacao_id INTEGER,
    data_inicio DATE,
    data_fim DATE,
    horario_inicio TIME,
    horario_fim TIME,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id),
    FOREIGN KEY (operacao_id) REFERENCES operacoes(id)
);

-- =========================
-- USUÁRIOS PADRÃO
-- =========================

-- admin
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- operador
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('operador', '1725165c9a0b3698a3d01016e0d8205155820b8d7f21835ca64c0f81c728d880', 'Operador RFID', 'operador', TRUE)
ON CONFLICT (username) DO NOTHING;

-- master
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('master', 'e7bc2f973afb8dfaf00fadfb19596741108be08ab4a107c6a799c429b684c64a', 'Master User', 'master', TRUE)
ON CONFLICT (username) DO UPDATE SET
    senha_hash = EXCLUDED.senha_hash,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    ativo = EXCLUDED.ativo;