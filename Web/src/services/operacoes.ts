import { fetchAPI } from '../api/api'

export interface OperacaoPeca {
    id: number
    nome: string
    codigo: string
    modelo_id?: number
    produto_id?: number
}

export interface Operacao {
    id: number
    nome: string
    sublinha_id: number
    posto_id: number
    produto_id: number
    modelo_id: number
    dispositivo_id: number | null
    data_inicio: string | null
    data_fim: string | null
    horario_inicio: string | null
    horario_fim: string | null
    pecas: OperacaoPeca[]
    data_criacao?: string
}

export interface CriarOperacaoData {
    nome: string
    sublinha_id: number
    posto_id: number
    produto_id: number
    modelo_id: number
    dispositivo_id?: number
    data_inicio?: string
    horario_inicio?: string
    data_fim?: string
    horario_fim?: string
}

export interface AtualizarOperacaoData {
    nome?: string
    sublinha_id?: number
    posto_id?: number
    produto_id?: number
    modelo_id?: number
    dispositivo_id?: number
    data_inicio?: string
    horario_inicio?: string
    data_fim?: string
    horario_fim?: string
}

export async function listarOperacoes(): Promise<Operacao[]> {
    const dados = await fetchAPI('/operacoes')
    if (!Array.isArray(dados)) return []
    return dados as Operacao[]
}

export async function criarOperacao(data: CriarOperacaoData): Promise<Operacao> {
    return await fetchAPI('/operacoes/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarOperacao(id: number, data: AtualizarOperacaoData): Promise<Operacao> {
    return await fetchAPI(`/operacoes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarOperacao(id: number): Promise<void> {
    await fetchAPI(`/operacoes/${id}`, { method: 'DELETE' })
}

export async function listarPecasOperacao(id: number): Promise<OperacaoPeca[]> {
    const dados = await fetchAPI(`/operacoes/${id}/pecas`)
    if (!Array.isArray(dados)) return []
    return dados as OperacaoPeca[]
}

export async function adicionarPecaOperacao(operacaoId: number, pecaId: number): Promise<void> {
    await fetchAPI(`/operacoes/${operacaoId}/pecas/${pecaId}`, {
        method: 'POST',
    })
}

export async function removerPecaOperacao(operacaoId: number, pecaId: number): Promise<void> {
    await fetchAPI(`/operacoes/${operacaoId}/pecas/${pecaId}`, {
        method: 'DELETE',
    })
}

