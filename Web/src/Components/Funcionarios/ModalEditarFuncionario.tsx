import { useState, useEffect } from 'react'
import ModalSucesso from '../Modais/ModalSucesso'
import ModalErro from '../Modais/ModalErro'
import {
    type Funcionario,
    type Turno,
    type AtualizarFuncionarioData,
    adicionarTagTemporaria,
    removerTagTemporaria,
} from '../../services/funcionarios'

interface ModalEditarFuncionarioProps {
    isOpen: boolean
    onClose: () => void
    onSave: (dados: AtualizarFuncionarioData) => void
    funcionarioEditando?: Funcionario | null
    turnosDisponiveis: Turno[]
}

const ModalEditarFuncionario = ({ isOpen, onClose, onSave, funcionarioEditando, turnosDisponiveis }: ModalEditarFuncionarioProps) => {
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tag, setTag] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [turnosSelecionados, setTurnosSelecionados] = useState<number[]>([])
    const [tagTemporaria, setTagTemporaria] = useState('')
    const [salvandoTag, setSalvandoTag] = useState(false)
    const [removendoTag, setRemovendoTag] = useState(false)
    const [tagTemporariaAtual, setTagTemporariaAtual] = useState<string | null>(null)
    const [expiracaoTagAtual, setExpiracaoTagAtual] = useState<string | null>(null)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')

    useEffect(() => {
        if (funcionarioEditando) {
            setMatricula(funcionarioEditando.matricula)
            setNome(funcionarioEditando.nome)
            setTag(funcionarioEditando.tag)
            setAtivo(funcionarioEditando.ativo)
            setTurnosSelecionados(funcionarioEditando.turnos.map(t => t.id))
            setTagTemporaria('')
            setTagTemporariaAtual(funcionarioEditando.tag_temporaria)
            setExpiracaoTagAtual(funcionarioEditando.expiracao_tag_temporaria)
        } else {
            setMatricula('')
            setNome('')
            setTag('')
            setAtivo(true)
            setTurnosSelecionados([])
            setTagTemporaria('')
            setTagTemporariaAtual(null)
            setExpiracaoTagAtual(null)
        }
    }, [funcionarioEditando])

    const normalizarTag = (valor: string) => valor.replace(/[\r\n\t\0]/g, '').trim()

    const handleAdicionarTagTemporaria = async () => {
        if (!funcionarioEditando?.id) return
        const tagNormalizada = normalizarTag(tagTemporaria)
        if (!tagNormalizada) {
            setTituloErro('Atenção!')
            setMensagemErro('Informe o código da tag temporária.')
            setModalErroAberto(true)
            return
        }
        setSalvandoTag(true)
        try {
            const atualizado = await adicionarTagTemporaria(funcionarioEditando.id, tagNormalizada)
            setTagTemporariaAtual(atualizado.tag_temporaria)
            setExpiracaoTagAtual(atualizado.expiracao_tag_temporaria)
            setTagTemporaria('')
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao cadastrar tag temporária: ${error?.message || 'Erro desconhecido'}`)
            setModalErroAberto(true)
        } finally {
            setSalvandoTag(false)
        }
    }

    const handleRemoverTagTemporaria = async () => {
        if (!funcionarioEditando?.id) return
        setRemovendoTag(true)
        try {
            const atualizado = await removerTagTemporaria(funcionarioEditando.id)
            setTagTemporariaAtual(atualizado.tag_temporaria)
            setExpiracaoTagAtual(atualizado.expiracao_tag_temporaria)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(`Erro ao remover tag temporária: ${error?.message || 'Erro desconhecido'}`)
            setModalErroAberto(true)
        } finally {
            setRemovendoTag(false)
        }
    }

    const calcularTempoRestante = (expiracao: string | null): string => {
        if (!expiracao) return ''
        try {
            const dataExp = expiracao.includes('T') && !expiracao.endsWith('Z')
                ? new Date(expiracao + 'Z')
                : new Date(expiracao)
            const diffMs = dataExp.getTime() - Date.now()
            if (diffMs <= 0) return 'Expirada'
            const horas = Math.floor(diffMs / (1000 * 60 * 60))
            const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            return `${horas}h ${minutos}m restantes`
        } catch {
            return ''
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!tag.trim()) {
            setTituloErro('Atenção!')
            setMensagemErro('A Tag RFID é obrigatória.')
            setModalErroAberto(true)
            return
        }
        if (turnosSelecionados.length === 0) {
            setTituloErro('Atenção!')
            setMensagemErro('Selecione pelo menos um turno.')
            setModalErroAberto(true)
            return
        }

        onSave({
            tag: tag.trim(),
            matricula,
            nome,
            ativo,
            turno_ids: turnosSelecionados,
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="text-white px-6 py-5 flex shrink-0" style={{ backgroundColor: 'var(--bg-azul)' }}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <i className="bi bi-person-gear text-xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Editar Funcionário</h3>
                                <p className="text-sm text-white text-opacity-90 mt-0.5">Atualize as informações do funcionário</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Conteúdo */}
                <form id="funcionario-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="space-y-4">
                        {/* Informações básicas */}
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <i className="bi bi-info-circle text-blue-600"></i>
                                </div>
                                <h4 className="text-base font-semibold text-gray-800">Informações Básicas</h4>
                            </div>

                            <div className="space-y-4">
                                {/* Tag RFID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag RFID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: 1234567890"
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Tag Temporária */}
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tag Temporária</label>
                                    {tagTemporariaAtual ? (
                                        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                                            <div>
                                                <span className="text-sm font-medium text-gray-800">{tagTemporariaAtual}</span>
                                                <p className="text-xs text-gray-500 mt-0.5">{calcularTempoRestante(expiracaoTagAtual)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoverTagTemporaria}
                                                disabled={removendoTag}
                                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                title="Remover tag temporária"
                                            >
                                                <i className="bi bi-trash text-sm"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                                                placeholder="Código da tag temporária"
                                                value={tagTemporaria}
                                                onChange={(e) => setTagTemporaria(normalizarTag(e.target.value))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        if (!salvandoTag) handleAdicionarTagTemporaria()
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAdicionarTagTemporaria}
                                                disabled={salvandoTag}
                                                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm disabled:opacity-50"
                                            >
                                                {salvandoTag ? <><i className="bi bi-hourglass-split mr-1"></i>Salvando...</> : <><i className="bi bi-plus-circle mr-1"></i>Cadastrar</>}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1.5">Tag temporária válida por 10 horas. Use quando o operador esquecer o crachá.</p>
                                </div>

                                {/* Matrícula */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Matrícula <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: 12345"
                                        required
                                        value={matricula}
                                        onChange={(e) => setMatricula(e.target.value)}
                                    />
                                </div>

                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome Completo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Ex: João Silva"
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                    />
                                </div>

                                {/* Ativo */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={ativo}
                                            onChange={(e) => setAtivo(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Funcionário Ativo</span>
                                            <p className="text-xs text-gray-500 mt-0.5">Funcionários inativos não podem realizar operações</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Turnos */}
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <i className="bi bi-clock text-purple-600"></i>
                                </div>
                                <h4 className="text-base font-semibold text-gray-800">Turnos <span className="text-red-500">*</span></h4>
                            </div>
                            {turnosDisponiveis.length > 0 ? (
                                <div className="flex gap-4 px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
                                    {turnosDisponiveis.map((turno) => (
                                        <label key={turno.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={turnosSelecionados.includes(turno.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setTurnosSelecionados([...turnosSelecionados, turno.id])
                                                    } else {
                                                        setTurnosSelecionados(turnosSelecionados.filter(id => id !== turno.id))
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">{turno.nome}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                                    Nenhum turno disponível.
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1.5">Selecione um ou mais turnos de trabalho do funcionário</p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="funcionario-form"
                        className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
                        style={{ backgroundColor: 'var(--bg-azul)' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Salvar Alterações</span>
                    </button>
                </div>
            </div>

            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => setModalSucessoAberto(false)}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />

            <ModalErro
                isOpen={modalErroAberto}
                onClose={() => setModalErroAberto(false)}
                mensagem={mensagemErro}
                titulo={tituloErro}
            />
        </div>
    )
}

export default ModalEditarFuncionario
