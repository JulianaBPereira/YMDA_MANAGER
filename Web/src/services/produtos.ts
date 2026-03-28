import { fetchAPI } from '../api/api'

export interface Produto {
    id: number
    nome: string
    data_criacao?: string
}

export interface CriarProdutoData {
    nome: string
}

export interface AtualizarProdutoData {
    nome: string
}

export async function listarProdutos(): Promise<Produto[]> {
    const dados = await fetchAPI('/produtos')
    if (!Array.isArray(dados)) return []
    return dados as Produto[]
}

export async function criarProduto(data: CriarProdutoData): Promise<Produto> {
    return await fetchAPI('/produtos/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarProduto(id: number, data: AtualizarProdutoData): Promise<Produto> {
    return await fetchAPI(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarProduto(id: number): Promise<void> {
    await fetchAPI(`/produtos/${id}`, { method: 'DELETE' })
}

