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
    expiracao_tag_temporaria TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_remocao TIMESTAMP
);

-- =========================
-- TURNOS
-- =========================
CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE funcionario_turnos (
    funcionario_id INTEGER,
    turno_id INTEGER,
    PRIMARY KEY (funcionario_id, turno_id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
);

-- =========================
-- LINHAS E SUBLINHAS
-- =========================
CREATE TABLE linhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sublinhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    linha_id INTEGER,
    FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE
);

-- =========================
-- DISPOSITIVOS
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
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_raspberry(id) ON DELETE SET NULL
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
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
);

CREATE TABLE pecas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modelo_pecas (
    modelo_id INTEGER,
    peca_id INTEGER,
    PRIMARY KEY (modelo_id, peca_id),
    FOREIGN KEY (modelo_id) REFERENCES modelos(id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sublinha_id) REFERENCES sublinhas(id) ON DELETE CASCADE,
    FOREIGN KEY (posto_id) REFERENCES postos(id) ON DELETE SET NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    FOREIGN KEY (modelo_id) REFERENCES modelos(id) ON DELETE SET NULL,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_raspberry(id) ON DELETE SET NULL
);

CREATE TABLE operacao_pecas (
    operacao_id INTEGER,
    peca_id INTEGER,
    PRIMARY KEY (operacao_id, peca_id),
    FOREIGN KEY (operacao_id) REFERENCES operacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE CASCADE
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
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL,
    FOREIGN KEY (operacao_id) REFERENCES operacoes(id) ON DELETE CASCADE
);

-- =========================
-- USUÁRIOS PADRÃO
-- =========================
INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('admin', '$2b$12$jNQyjyeS8PzWSxieV3V7L.x/z0bfnfLQCx/scYw8nBjS9oYfwcuAm', 'Administrador', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('operador', '$2b$12$EzYZjNtADUxKIe95LVKgIOq.NekkfNi.6HyhBUCIVEI4QCpV.VgF6', 'Operador RFID', 'operador', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO usuarios (username, senha_hash, nome, role, ativo)
VALUES ('master', '$2b$12$FA9ZE1GLjBW244.ypLJOY.Ej6P4Sw2sfv1LcWylqvB5G/8ZHoOJPu', 'Master User', 'master', TRUE)
ON CONFLICT (username) DO UPDATE SET
    senha_hash = EXCLUDED.senha_hash,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    ativo = EXCLUDED.ativo;