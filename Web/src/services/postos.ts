import { fetchAPI } from '../api/api'

export interface Posto {
    id: number
    nome: string
    sublinha_id: number
    dispositivo_id?: number
    data_criacao?: string
}

export interface CriarPostoData {
    nome: string
    sublinha_id: number
    dispositivo_id?: number
}

export interface AtualizarPostoData {
    nome?: string
    sublinha_id?: number
    dispositivo_id?: number
}

export async function listarPostos(): Promise<Posto[]> {
    const dados = await fetchAPI('/postos')
    if (!Array.isArray(dados)) return []
    return dados as Posto[]
}

export async function criarPosto(data: CriarPostoData): Promise<Posto> {
    return await fetchAPI('/postos/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarPosto(id: number, data: AtualizarPostoData): Promise<Posto> {
    return await fetchAPI(`/postos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarPosto(id: number): Promise<void> {
    await fetchAPI(`/postos/${id}`, { method: 'DELETE' })
}
