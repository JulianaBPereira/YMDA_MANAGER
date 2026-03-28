import { fetchAPI } from '../api/api'

export interface RegistroProducao {
    id: number
    funcionario_id: number
    operacao_id: number
    data_inicio: string
    horario_inicio: string
    data_fim?: string | null
    horario_fim?: string | null
    criado_em?: string
    turno?: string | null
}

export interface CriarRegistroData {
    funcionario_id: number
    operacao_id: number
    data_inicio: string
    horario_inicio: string
    data_fim?: string | null
    horario_fim?: string | null
}

export interface FinalizarRegistroData {
    data_fim: string
    horario_fim: string
}

export async function listarRegistros(): Promise<RegistroProducao[]> {
    const dados = await fetchAPI('/registros-producao')
    if (!Array.isArray(dados)) return []
    return dados as RegistroProducao[]
}

export async function listarRegistrosEmAberto(): Promise<RegistroProducao[]> {
    const dados = await fetchAPI('/registros-producao/em-aberto')
    if (!Array.isArray(dados)) return []
    return dados as RegistroProducao[]
}

export async function criarRegistro(data: CriarRegistroData): Promise<RegistroProducao> {
    return await fetchAPI('/registros-producao/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function finalizarRegistro(id: number, data: FinalizarRegistroData): Promise<RegistroProducao> {
    return await fetchAPI(`/registros-producao/${id}/finalizar`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

export async function deletarRegistro(id: number): Promise<void> {
    await fetchAPI(`/registros-producao/${id}`, { method: 'DELETE' })
}

