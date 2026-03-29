import { useEffect, useMemo, useState } from 'react'
import ModalBase from '../Compartilhados/ModalBase'

interface Produto {
    id: number
    nome: string
}

interface Modelo {
    id: number
    nome: string
    produto_id?: number
}

interface Posto {
    id: number
    nome: string
    sublinha_id: number
    dispositivo_id?: number
}

interface Sublinha {
    id: number
    linha_id: number
    nome: string
    linha_nome?: string
}

interface Dispositivo {
    id: number
    serial_number: string
}

interface Peca {
    id: number
    codigo: string
    nome: string
    modelo_id?: number
}

interface OperacaoEditando {
    id: number
    operacao: string
    produto_id?: number
    modelo_id?: number
    posto_id?: number
    pecas: string[]
}

interface DadosEdicaoOperacao {
    operacao: string
    produto_id: number
    modelo_id: number
    posto_id: number
    pecas: string[]
}

interface ModalEditarOperacaoProps {
    isOpen: boolean
    onClose: () => void
    onSave: (dados: DadosEdicaoOperacao) => Promise<void>
    operacaoEditando: OperacaoEditando | null
    produtos: Produto[]
    todosModelos: Modelo[]
    postos: Posto[]
    sublinhas: Sublinha[]
    dispositivos: Dispositivo[]
    todasPecas: Peca[]
}

const ModalEditarOperacao = ({
    isOpen,
    onClose,
    onSave,
    operacaoEditando,
    produtos,
    todosModelos,
    postos,
    sublinhas,
    dispositivos,
    todasPecas,
}: ModalEditarOperacaoProps) => {
    const [operacao, setOperacao] = useState('')
    const [produtoId, setProdutoId] = useState(0)
    const [modeloId, setModeloId] = useState(0)
    const [postoId, setPostoId] = useState(0)
    const [linha, setLinha] = useState('')
    const [toten, setToten] = useState('')
    const [pecasSelecionadas, setPecasSelecionadas] = useState<string[]>([])
    const [pecaTemp, setPecaTemp] = useState('')
    const [salvando, setSalvando] = useState(false)

    const modelos = useMemo(
        () => todosModelos.filter((modelo) => modelo.produto_id === produtoId),
        [todosModelos, produtoId]
    )

    const pecasDisponiveis = useMemo(
        () => todasPecas.filter((peca) => peca.modelo_id === modeloId),
        [todasPecas, modeloId]
    )

    useEffect(() => {
        if (!isOpen || !operacaoEditando) return

        setOperacao(operacaoEditando.operacao)
        setProdutoId(operacaoEditando.produto_id || 0)
        setModeloId(operacaoEditando.modelo_id || 0)
        setPostoId(operacaoEditando.posto_id || 0)
        setPecasSelecionadas(operacaoEditando.pecas || [])
        setPecaTemp('')
        setSalvando(false)
    }, [isOpen, operacaoEditando])

    useEffect(() => {
        if (!postoId) {
            setLinha('')
            setToten('')
            return
        }

        const postoSelecionado = postos.find((posto) => posto.id === postoId)
        const sublinhaSelecionada = sublinhas.find((sublinha) => sublinha.id === postoSelecionado?.sublinha_id)
        const dispositivoSelecionado = dispositivos.find((dispositivo) => dispositivo.id === postoSelecionado?.dispositivo_id)

        setLinha(
            sublinhaSelecionada
                ? (sublinhaSelecionada.linha_nome
                    ? `${sublinhaSelecionada.linha_nome} - ${sublinhaSelecionada.nome}`
                    : sublinhaSelecionada.nome)
                : ''
        )
        setToten(dispositivoSelecionado?.serial_number || '')
    }, [postoId, postos, sublinhas, dispositivos])

    const adicionarPeca = () => {
        if (!pecaTemp.trim() || pecasSelecionadas.includes(pecaTemp)) return
        setPecasSelecionadas((atual) => [...atual, pecaTemp])
        setPecaTemp('')
    }

    const removerPeca = (indice: number) => {
        setPecasSelecionadas((atual) => atual.filter((_, index) => index !== indice))
    }

    const handleSalvar = async () => {
        if (!operacao.trim() || !produtoId || !modeloId || !postoId || !linha) return

        setSalvando(true)
        try {
            await onSave({
                operacao: operacao.trim(),
                produto_id: produtoId,
                modelo_id: modeloId,
                posto_id: postoId,
                pecas: pecasSelecionadas,
            })
            onClose()
        } finally {
            setSalvando(false)
        }
    }

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={handleSalvar}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-azul)' }}
                disabled={salvando || !operacao.trim() || !produtoId || !modeloId || !postoId || !linha}
            >
                <i className="bi bi-check-circle-fill"></i>
                <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
            </button>
        </>
    )

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            titulo="Editar Operação"
            icone="bi bi-pencil-square"
            corHeader="azul"
            maxWidth="xl"
            footer={footer}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operação *</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={operacao}
                        onChange={(e) => setOperacao(e.target.value)}
                        placeholder="Ex: Soldagem da coluna"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={produtoId}
                        onChange={(e) => {
                            setProdutoId(Number(e.target.value))
                            setModeloId(0)
                            setPecaTemp('')
                            setPecasSelecionadas([])
                        }}
                    >
                        <option value={0}>Selecione</option>
                        {produtos.map((produto) => (
                            <option key={produto.id} value={produto.id}>{produto.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={modeloId}
                        onChange={(e) => {
                            setModeloId(Number(e.target.value))
                            setPecaTemp('')
                            setPecasSelecionadas([])
                        }}
                    >
                        <option value={0}>Selecione</option>
                        {modelos.map((modelo) => (
                            <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posto *</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={postoId}
                        onChange={(e) => setPostoId(Number(e.target.value))}
                    >
                        <option value={0}>Selecione</option>
                        {postos.map((posto) => (
                            <option key={posto.id} value={posto.id}>{posto.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linha *</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                        value={linha || 'Selecione um posto para preencher'}
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Toten/ID</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                        value={toten || 'Selecione um posto para preencher'}
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peça</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={pecaTemp}
                            onChange={(e) => setPecaTemp(e.target.value)}
                            disabled={modeloId === 0 || pecasDisponiveis.length === 0}
                        >
                            <option value="">
                                {modeloId === 0
                                    ? 'Selecione um modelo primeiro'
                                    : pecasDisponiveis.length === 0
                                    ? 'Nenhuma peça disponível para este modelo'
                                    : 'Selecione uma peça'}
                            </option>
                            {pecasDisponiveis.map((peca) => {
                                const display = `${peca.nome} - ${peca.codigo}`
                                return (
                                    <option key={peca.id} value={display}>{display}</option>
                                )
                            })}
                        </select>
                        <button
                            type="button"
                            onClick={adicionarPeca}
                            disabled={!pecaTemp.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            <i className="bi bi-plus-lg"></i>
                        </button>
                    </div>
                    {pecasSelecionadas.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {pecasSelecionadas.map((peca, index) => (
                                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                                    {peca}
                                    <button
                                        type="button"
                                        onClick={() => removerPeca(index)}
                                        className="text-green-600 hover:text-green-800"
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ModalBase>
    )
}

export default ModalEditarOperacao
