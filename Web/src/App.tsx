import { Routes, Route, Navigate } from "react-router-dom";
import Funcionarios from "./Pages/Funcionarios";
import Registros from "./Pages/Registros";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import LoginAdmin from "./Pages/LoginAdmin";
import ProtectedRoute from "./Components/ProtectedRoute";
import Linhas from "./Pages/Linhas";
import Postos from "./Pages/Postos";
import Operacoes from "./Pages/Operacoes";
import Usuarios from "./Pages/Usuarios";
import ListagemPecas from "./Pages/ListagemPecas";
import ListagemProdutosModelos from "./Pages/ListagemProdutosModelos";
import CadastroUsuario from "./Pages/CadastroUsuario";
import DispositivosRaspberry from "./Pages/DispositivosRaspberry";
import ProdutosModelos from "./Pages/ProdutosModelos";
import LeitorIHM from "./Pages/IHM/Leitor";
import OperacaoIHM from "./Pages/IHM/Operacao";
import LeitorFinalizarIHM from "./Pages/IHM/LeitorFinalizar";
import FinalizarProducaoIHM from "./Pages/IHM/FinalizarProducao";


function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/IHM" element={<Login />} />
      <Route path="/login" element={<Navigate to="/IHM" replace />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
      
      {/* Rotas públicas/admin */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute onlyAdmin>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/funcionarios" 
        element={
          <ProtectedRoute onlyAdmin>
            <Funcionarios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cadastro-produto-modelo" 
        element={
          <ProtectedRoute onlyAdmin>
            <ProdutosModelos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/listagem-pecas" 
        element={
          <ProtectedRoute onlyAdmin>
            <ListagemPecas />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/listagem-produtos-modelos" 
        element={
          <ProtectedRoute onlyAdmin>
            <ListagemProdutosModelos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/registros" 
        element={
          <ProtectedRoute onlyAdmin>
            <Registros />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/linhas" 
        element={
          <ProtectedRoute onlyAdmin>
            <Linhas />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/postos" 
        element={
          <ProtectedRoute onlyAdmin>
            <Postos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/operacoes" 
        element={
          <ProtectedRoute onlyAdmin>
            <Operacoes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <Usuarios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dispositivos-raspberry" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'master']}>
            <DispositivosRaspberry />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ihm/leitor"
        element={
          <ProtectedRoute allowedRoles={['operador']}>
            <LeitorIHM />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ihm/operacao"
        element={
          <ProtectedRoute allowedRoles={['operador']}>
            <OperacaoIHM />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ihm/leitor-finalizar"
        element={
          <ProtectedRoute allowedRoles={['operador']}>
            <LeitorFinalizarIHM />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ihm/finalizar-producao"
        element={
          <ProtectedRoute allowedRoles={['operador']}>
            <FinalizarProducaoIHM />
          </ProtectedRoute>
        }
      />
      
      
      {/* Redireciona rotas não encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
