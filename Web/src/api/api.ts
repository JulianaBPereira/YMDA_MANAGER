export const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `http://${window.location.hostname}:8001/api`

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
