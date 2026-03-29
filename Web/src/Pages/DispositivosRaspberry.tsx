import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import { listarDispositivos, criarDispositivo, atualizarDispositivo, deletarDispositivo } from '../services/dispositivos'

interface DispositivoRaspberry {
    id: number
    serial: string
    nome: string
    data_registro?: string
}

const DispositivosRaspberry = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [dispositivos, setDispositivos] = useState<DispositivoRaspberry[]>([])
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)

    const [serialNovo, setSerialNovo] = useState('')
    const [nomeNovo, setNomeNovo] = useState('')
    const [salvando, setSalvando] = useState(false)

    const [dispositivoEditando, setDispositivoEditando] = useState<DispositivoRaspberry | null>(null)

    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')

    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [dispositivoAExcluir, setDispositivoAExcluir] = useState<DispositivoRaspberry | null>(null)
    const [excluindo, setExcluindo] = useState(false)

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarDispositivos()
        }
    }, [abaAtiva])

    const carregarDispositivos = async () => {
        try {
            const resp = await listarDispositivos()
            setDispositivos(resp.map(d => ({
                id: d.id,
                serial: d.serial_number,
                nome: d.nome,
                data_registro: d.data_criacao,
            })))
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao carregar dispositivos')
            setModalErroAberto(true)
            setDispositivos([])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const serial = serialNovo.trim()
        if (!serial) {
            setMensagemErro('Informe o serial do dispositivo.')
            setModalErroAberto(true)
            return
        }
        setSalvando(true)
        try {
            await criarDispositivo({
                nome: nomeNovo.trim(),
                serial_number: serial,
            })
            setMensagemSucesso('Dispositivo cadastrado com sucesso!')
            setModalSucessoAberto(true)
            limparFormulario()
            await carregarDispositivos()
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao cadastrar dispositivo')
            setModalErroAberto(true)
        } finally {
            setSalvando(false)
        }
    }

    const limparFormulario = () => {
        setSerialNovo('')
        setNomeNovo('')
    }

    const handleEditar = (dispositivo: DispositivoRaspberry) => {
        setDispositivoEditando(dispositivo)
        setModalEdicaoAberto(true)
    }

    const handleSalvarEdicao = async (dados: Record<string, any>) => {
        if (!dispositivoEditando) return
        try {
            await atualizarDispositivo(dispositivoEditando.id, {
                nome: dados.nome?.trim() || '',
                serial_number: dispositivoEditando.serial,
            })
            setModalEdicaoAberto(false)
            setDispositivoEditando(null)
            await carregarDispositivos()
            setMensagemSucesso('Dispositivo atualizado com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao atualizar dispositivo')
            setModalErroAberto(true)
        }
    }

    const handleExcluir = (dispositivo: DispositivoRaspberry) => {
        setDispositivoAExcluir(dispositivo)
        setModalExcluirAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!dispositivoAExcluir) return
        try {
            setExcluindo(true)
            await deletarDispositivo(dispositivoAExcluir.id)
            setModalExcluirAberto(false)
            setDispositivoAExcluir(null)
            await carregarDispositivos()
        } catch (e: any) {
            setModalExcluirAberto(false)
            setDispositivoAExcluir(null)
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao excluir dispositivo')
            setModalErroAberto(true)
        } finally {
            setExcluindo(false)
        }
    }

    const fecharModalExcluir = () => {
        setModalExcluirAberto(false)
        setDispositivoAExcluir(null)
    }

    const formatarData = (data: string | undefined) => {
        if (!data) return '-'

        try {
            return new Date(data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
        } catch {
            return data
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
									<i className="bi bi-plus-circle-fill mr-2"></i>
									Cadastrar
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'listar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar
                                </button>
                            </div>

                            <div className={abaAtiva === 'cadastrar' ? 'p-6' : ''}>
                                {abaAtiva === 'cadastrar' && (
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Serial
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={serialNovo}
                                                onChange={(e) => setSerialNovo(e.target.value)}
                                                placeholder="Ex: 10000000abc12345"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={nomeNovo}
                                                onChange={(e) => setNomeNovo(e.target.value)}
                                                placeholder="Ex: RFID13"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={salvando || !serialNovo.trim()}
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                            >
                                                <i className="bi bi-plus-circle-fill"></i>
                                                <span>{salvando ? 'Cadastrando...' : 'Cadastrar'}</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {abaAtiva === 'listar' && (
                            <div className="flex flex-col gap-6 mt-6">
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Serial</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nome</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data Registro</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acoes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {dispositivos.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                <p className="text-gray-500 text-lg font-medium">Nenhum dispositivo cadastrado</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    dispositivos.map((dispositivo) => (
                                                        <tr key={dispositivo.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{dispositivo.serial}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{dispositivo.nome || '-'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{formatarData(dispositivo.data_registro)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleEditar(dispositivo)}
                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                        title="Editar dispositivo"
                                                                    >
                                                                        <i className="bi bi-pencil-square"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleExcluir(dispositivo)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                        title="Excluir dispositivo"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModalExcluir}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir dispositivo"
                mensagem="tem certeza que deseja excluir este dispositvo ?"
                textoConfirmar={excluindo ? 'Excluindo...' : 'Excluir'}
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />
            <ModalFormulario
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false)
                    setDispositivoEditando(null)
                }}
                onSave={handleSalvarEdicao}
                itemEditando={
                    dispositivoEditando
                        ? {
                              serial: dispositivoEditando.serial,
                              nome: dispositivoEditando.nome || '',
                          }
                        : null
                }
                tituloNovo="Novo Dispositivo"
                tituloEditar="Editar Dispositivo"
                campos={[
                    {
                        nome: 'serial',
                        label: 'Serial',
                        tipo: 'text',
                        placeholder: 'Ex: 10000000abc12345',
                        required: false,
                        disabled: true,
                    },
                    {
                        nome: 'nome',
                        label: 'Nome (opcional)',
                        tipo: 'text',
                        placeholder: 'Ex: RFID13',
                        required: false,
                    },
                ]}
                textoBotao="Salvar"
                icone="bi bi-cpu"
                secaoTitulo="Informacoes do Dispositivo"
            />
        </div>
    )
}

export default DispositivosRaspberry
