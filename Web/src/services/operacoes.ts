import { fetchAPI } from '../api/api'

export interface Operacao {
    id: number
    nome: string
}

export interface CriarOperacaoData {
    nome: string
}

export interface AtualizarOperacaoData {
    nome: string
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

