import { fetchAPI } from '../api/api'

export interface Linha {
    id: number
    nome: string
    data_criacao?: string
}

export interface Sublinha {
    id: number
    nome: string
    linha_id: number
    linha_nome?: string
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

export interface CriarSublinhaData {
    nome: string
    linha_id: number
}

export interface AtualizarSublinhaData {
    nome: string
    linha_id: number
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

// ─── Sublinhas ─────────────────────────────────────────────────────────────────

export async function criarSublinha(data: CriarSublinhaData): Promise<Sublinha> {
    return await fetchAPI('/linhas/sublinhas', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarSublinha(id: number, data: AtualizarSublinhaData): Promise<Sublinha> {
    return await fetchAPI(`/linhas/sublinhas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarSublinha(id: number): Promise<void> {
    await fetchAPI(`/linhas/sublinhas/${id}`, { method: 'DELETE' })
}

// Listar sublinhas com nome da linha (para Postos)
export async function listarSublinhas(): Promise<Sublinha[]> {
    const dados = await fetchAPI('/linhas/sublinhas')
    if (!Array.isArray(dados)) return []
    return dados as Sublinha[]
}
