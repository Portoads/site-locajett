import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import { PublicLayout } from './components/Layout'
import { Home, JetSkis, JetSkiDetail, Experiencias, ComoFunciona, Locais, Sobre, Contato, Venda, VendaDetalhe } from './pages/Public'
import { loadRemote } from './store'
import MinhaReserva from './pages/MinhaReserva'
import { Login, Cadastro, ClienteLayout, ClienteHome, ClienteReservas, ClienteLocacoes, ClientePagamentos, ClienteContratos, ClientePerfil } from './pages/Cliente'
import { AdminLayout, AdminModule } from './pages/admin/Admin'
import { PageHead } from './components/Layout'

loadRemote()
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jet-skis" element={<JetSkis />} />
        <Route path="/jet-skis/:id" element={<JetSkiDetail />} />
        <Route path="/experiencias" element={<Experiencias />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/locais" element={<Locais />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/venda" element={<Venda />} />
        <Route path="/venda/:id" element={<VendaDetalhe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/minha-reserva" element={<MinhaReserva />} />
        <Route path="/cliente" element={<ClienteLayout />}>
          <Route index element={<ClienteHome />} />
          <Route path="reservas" element={<ClienteReservas />} />
          <Route path="locacoes" element={<ClienteLocacoes />} />
          <Route path="pagamentos" element={<ClientePagamentos />} />
          <Route path="contratos" element={<ClienteContratos />} />
          <Route path="perfil" element={<ClientePerfil />} />
        </Route>
        <Route path="*" element={<PageHead eyebrow="404" title="Página não encontrada" text="Volte ao início e escolha seu Jet Ski." />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path=":mod" element={<AdminModule />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
