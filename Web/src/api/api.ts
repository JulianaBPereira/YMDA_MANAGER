export const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `http://${window.location.hostname}:8001/api`

export function getDashboardWebSocketUrl() {
    const configured = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8001`
    const wsBase = configured.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')
    return `${wsBase}/api/registros-producao/ws/dashboard`
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    let usuarioId: string | null = null
    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            usuarioId = user.id?.toString() || null
        }
    } catch {
        // ignorar erros ao ler localStorage
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }

    if (usuarioId) {
        headers['X-User-Id'] = usuarioId
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    // Tentar parsear JSON apenas quando houver conteúdo JSON
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    // 204 No Content: não tentar parsear
    if (response.status === 204) {
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`)
        }
        return {}
    }

    const data = isJson
        ? await response.json().catch(() => ({ erro: 'Erro ao processar resposta' }))
        : await response.text().catch(() => '')

    if (!response.ok) {
        const detail = isJson ? (data as any)?.detail : undefined
        const errorMessage =
            (isJson && (data as any)?.erro) ||
            (isJson && (data as any)?.error) ||
            (isJson && (data as any)?.message) ||
            (typeof detail === 'string' ? detail : undefined) ||
            `Erro ${response.status}`
        throw new Error(errorMessage)
    }

    if (isJson && (data as any)?.erro) {
        throw new Error(data.erro)
    }

    return isJson ? data : {}
}

export const ihmAPI = {
    async validarRfid(codigo: string) {
        return await fetchAPI(`/ihm/rfid/${encodeURIComponent(codigo)}`)
    },
    async buscarContextoOperacao(operador: string) {
        return await fetchAPI(`/ihm/contexto-operacao/${encodeURIComponent(operador)}`)
    },
}

export const producaoAPI = {
    async buscarRegistroAberto(posto: string, funcionario_matricula: string) {
        const params = new URLSearchParams({
            posto,
            funcionario_matricula,
        })
        return await fetchAPI(`/ihm/producao/registro-aberto?${params.toString()}`)
    },
    async registrarEntrada(payload: {
        posto?: string
        funcionario_matricula: string
        modelo_codigo?: string
        operacao?: string
        peca?: string
        codigo?: string
    }) {
        return await fetchAPI('/ihm/producao/entrada', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    },
    async registrarSaida(payload: {
        posto?: string
        funcionario_matricula?: string
        registro_id?: number
        quantidade?: number
    }) {
        return await fetchAPI('/ihm/producao/saida', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    },
}

export const dashboardAPI = {
    async buscarPostosDashboard() {
        return await fetchAPI('/registros-producao/dashboard/postos')
    },
    async atualizarComentario(registroId: number, comentario: string) {
        return await fetchAPI(`/registros-producao/${registroId}/comentario`, {
            method: 'PUT',
            body: JSON.stringify({ comentario }),
        })
    },
}