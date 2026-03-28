import { fetchAPI } from '../api/api'

export interface Dispositivo {
    id: number
    nome: string
    serial_number: string
    criado_em?: string
}

export interface CriarDispositivoData {
    nome: string
    serial_number: string
}

export interface AtualizarDispositivoData {
    nome: string
    serial_number: string
}

export async function listarDispositivos(): Promise<Dispositivo[]> {
    const dados = await fetchAPI('/dispositivos')
    if (!Array.isArray(dados)) return []
    return dados as Dispositivo[]
}

export async function buscarDispositivo(id: number): Promise<Dispositivo> {
    return await fetchAPI(`/dispositivos/${id}`)
}

export async function criarDispositivo(data: CriarDispositivoData): Promise<Dispositivo> {
    return await fetchAPI('/dispositivos/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function atualizarDispositivo(id: number, data: AtualizarDispositivoData): Promise<Dispositivo> {
    return await fetchAPI(`/dispositivos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarDispositivo(id: number): Promise<void> {
    await fetchAPI(`/dispositivos/${id}`, { method: 'DELETE' })
}

export async function registrarDispositivoLocal(): Promise<Dispositivo> {
    return await fetchAPI('/dispositivos/registrar-local', { method: 'POST' })
}

