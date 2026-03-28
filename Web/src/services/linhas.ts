import { fetchAPI } from '../api/api'

export interface Linha {
    id: number
    nome: string
    data_criacao?: string
}

export interface CriarLinhaData {
    nome: string
}

export interface AtualizarLinhaData {
    nome: string
}

export interface CriarLinhaComSublinhaData {
    nome_linha: string
    nome_sublinha: string
}

export async function listarLinhas(): Promise<Linha[]> {
    const dados = await fetchAPI('/linhas')
    if (!Array.isArray(dados)) return []
    return dados as Linha[]
}

export async function criarLinha(data: CriarLinhaData): Promise<Linha> {
    return await fetchAPI('/linhas/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarLinha(id: number, data: AtualizarLinhaData): Promise<Linha> {
    return await fetchAPI(`/linhas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarLinha(id: number): Promise<void> {
    await fetchAPI(`/linhas/${id}`, { method: 'DELETE' })
}

export async function criarLinhaComSublinha(data: CriarLinhaComSublinhaData): Promise<Linha> {
    return await fetchAPI('/linhas/com-sublinha', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}
