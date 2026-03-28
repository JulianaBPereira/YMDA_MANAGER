import { fetchAPI } from '../api/api'

export interface Modelo {
    id: number
    nome: string
    produto_id?: number
    data_criacao?: string
}

export interface CriarModeloData {
    nome: string
    produto_id: number
}

export interface AtualizarModeloData {
    nome: string
    produto_id: number
}

export async function listarModelos(): Promise<Modelo[]> {
    const dados = await fetchAPI('/modelos')
    if (!Array.isArray(dados)) return []
    return dados as Modelo[]
}

export async function listarModelosPorProduto(produtoId: number): Promise<Modelo[]> {
    const dados = await fetchAPI(`/modelos/por-produto/${produtoId}`)
    if (!Array.isArray(dados)) return []
    return dados as Modelo[]
}

export async function criarModelo(data: CriarModeloData): Promise<Modelo> {
    return await fetchAPI('/modelos/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarModelo(id: number, data: AtualizarModeloData): Promise<Modelo> {
    return await fetchAPI(`/modelos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarModelo(id: number): Promise<void> {
    await fetchAPI(`/modelos/${id}`, { method: 'DELETE' })
}

