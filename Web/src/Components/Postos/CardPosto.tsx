import React from 'react'

interface Posto {
    posto_id: number
    nome: string
    sublinha_id: number
    toten_id: number
    serial?: string
    totem_nome?: string
	data_criacao?: string
}

interface CardPostoProps {
    posto: Posto
    nomeSublinha: string
	dispositivoNome?: string
	dispositivoSerial?: string
    onRemoverPosto: () => void
    onEditarPosto: () => void
}

const CardPosto: React.FC<CardPostoProps> = ({
    posto,
    nomeSublinha,
	dispositivoNome,
	dispositivoSerial,
    onRemoverPosto,
    onEditarPosto
}) => {
    return (
		<div className="px-4 py-3 border-b border-gray-200">
			<div className="p-0">
				<div className="flex items-center gap-3">
					<span className="w-8" />
					<div className="grid grid-cols-4 items-center w-full gap-4">
						<div className="col-span-1">
							<span className="text-gray-900">{posto.nome}</span>
						</div>
						<div className="col-span-1 text-center">
							<span className="text-gray-900">{nomeSublinha}</span>
						</div>
						<div className="col-span-1 text-center">
							<span className="text-gray-900">
								{dispositivoNome || posto.totem_nome || 'Raspberry'}
								{dispositivoSerial || posto.serial ? ` (${dispositivoSerial || posto.serial})` : ''}
							</span>
						</div>
						<div className="col-span-1 text-right pr-8">
							<span className="text-gray-900">
								{posto.data_criacao ? new Date(posto.data_criacao).toLocaleDateString('pt-BR') : '-'}
							</span>
						</div>
					</div>
					<div className="w-24 flex justify-end gap-2">
						<button
							onClick={onEditarPosto}
							className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
							title="Editar posto"
						>
							<i className="bi bi-pencil"></i>
						</button>
						<button
							onClick={onRemoverPosto}
							className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
							title="Remover posto"
						>
							<i className="bi bi-trash"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
    )
}

export default CardPosto
