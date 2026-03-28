import { fetchAPI } from '../api/api'

export interface Peca {
    id: number
    codigo: string
    nome: string
    modelo_id?: number
    modelo_nome?: string
    produto_nome?: string
    produto_id?: number
}

export interface CriarPecaData {
    nome: string
    codigo: string
}

export interface AtualizarPecaData {
    nome: string
    codigo: string
}

export async function listarPecas(): Promise<Peca[]> {
    const dados = await fetchAPI('/pecas')
    if (!Array.isArray(dados)) return []
    return dados as Peca[]
}

export async function criarPeca(data: CriarPecaData): Promise<Peca> {
    return await fetchAPI('/pecas/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarPeca(id: number, data: AtualizarPecaData): Promise<Peca> {
    return await fetchAPI(`/pecas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarPeca(id: number): Promise<void> {
    await fetchAPI(`/pecas/${id}`, { method: 'DELETE' })
}

