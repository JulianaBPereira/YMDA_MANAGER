import { fetchAPI } from '../api/api'

export interface Turno {
    id: number
    nome: string
}

export interface OperacaoResumo {
    id: number
    nome: string
}

export interface Funcionario {
    id: number
    tag: string
    matricula: string
    nome: string
    ativo: boolean
    tag_temporaria: string | null
    expiracao_tag_temporaria: string | null
    data_criacao: string
    turnos: Turno[]
    operacoes: OperacaoResumo[]
}

// Espelho de FuncionarioCreate do backend
export interface CriarFuncionarioData {
    tag: string           // obrigatório
    matricula: string     // obrigatório
    nome: string          // obrigatório
    ativo?: boolean
    tag_temporaria?: string
    turno_ids: number[]   // obrigatório, mínimo 1
    operacao_ids?: number[]
}

// Espelho de FuncionarioUpdate do backend
export interface AtualizarFuncionarioData {
    tag: string           // obrigatório
    matricula: string     // obrigatório
    nome: string          // obrigatório
    ativo: boolean        // obrigatório
    tag_temporaria?: string
    turno_ids: number[]   // obrigatório, mínimo 1
    operacao_ids?: number[]
}

// ─── Funções de serviço ───────────────────────────────────────────────────────

// Tenta listar turnos por endpoint dedicado (se existir no backend)
export async function listarTurnos(): Promise<Turno[]> {
    try {
        const dados = await fetchAPI('/turnos')
        if (!Array.isArray(dados)) return []
        return (dados as Array<{ id: number; nome: string }>).map(t => ({
            id: Number(t.id),
            nome: String(t.nome || ''),
        }))
    } catch {
        // Se o endpoint não existir/retornar erro, devolve vazio e usamos fallback
        return []
    }
}

export async function criarTurno(nome: string): Promise<Turno | null> {
    try {
        const criado = await fetchAPI('/turnos', {
            method: 'POST',
            body: JSON.stringify({ nome }),
        })
        if (!criado || typeof criado !== 'object') return null
        return { id: Number((criado as any).id), nome: String((criado as any).nome || nome) }
    } catch {
        return null
    }
}

export async function garantirTurnosPadrao(): Promise<Turno[]> {
    const existentes = await listarTurnos()
    if (existentes.length > 0) return existentes

    const padroes = ['Matutino', 'Vespertino', 'Noturno']
    for (const nome of padroes) {
        // Ignora erro individual; tenta criar todos
        await criarTurno(nome)
    }
    return await listarTurnos()
}

// GET /funcionarios/
export async function listarFuncionarios(): Promise<Funcionario[]> {
    const dados = await fetchAPI('/funcionarios')
    if (!Array.isArray(dados)) return []
    return dados as Funcionario[]
}

// POST /funcionarios/
export async function criarFuncionario(data: CriarFuncionarioData): Promise<Funcionario> {
    return await fetchAPI('/funcionarios', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

// PUT /funcionarios/{id}
export async function atualizarFuncionario(id: number, data: AtualizarFuncionarioData): Promise<Funcionario> {
    return await fetchAPI(`/funcionarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

// DELETE /funcionarios/{id}
export async function deletarFuncionario(id: number): Promise<void> {
    await fetchAPI(`/funcionarios/${id}`, {
        method: 'DELETE',
    })
}

// POST /funcionarios/{id}/tag-temporaria
export async function adicionarTagTemporaria(id: number, tagTemporaria: string): Promise<Funcionario> {
    return await fetchAPI(`/funcionarios/${id}/tag-temporaria`, {
        method: 'POST',
        body: JSON.stringify({ tag_temporaria: tagTemporaria }),
    })
}

// DELETE /funcionarios/{id}/tag-temporaria
export async function removerTagTemporaria(id: number): Promise<Funcionario> {
    return await fetchAPI(`/funcionarios/${id}/tag-temporaria`, {
        method: 'DELETE',
    })
}

// Extrai turnos únicos da lista de funcionários (não há endpoint dedicado de turnos)
export async function listarTurnosDisponiveis(): Promise<Turno[]> {
    const funcionarios = await listarFuncionarios()
    const mapa = new Map<number, Turno>()
    for (const f of funcionarios) {
        for (const t of f.turnos) {
            if (!mapa.has(t.id)) mapa.set(t.id, t)
        }
    }
    return Array.from(mapa.values()).sort((a, b) => a.id - b.id)
}
