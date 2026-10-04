import { useSyncExternalStore } from 'react'
import { SITE } from './config'

// ------------------------------------------------------------------
// Banco de dados local (modo demonstração).
// Estrutura espelha as tabelas descritas em SPEC.mdx (jet_skis,
// reservations, clients...). Para produção, troque load/save por
// chamadas à API (ver SPEC.mdx › Banco de dados).
// ------------------------------------------------------------------
const KEY = 'locajett_db_v1'
const uid = () => Math.random().toString(36).slice(2, 10)
export const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const today = () => localISO(new Date())
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localISO(d) }

const seed = () => {
  const locations = [
    { id: 'l1', nome: 'Local 1 — [INSERIR CIDADE]', regiao: 'Centro', descricao: '[INSERIR ENDEREÇO / PONTO DE ENCONTRO]', ativo: true },
    { id: 'l2', nome: 'Local 2 — [INSERIR CIDADE]', regiao: 'Norte', descricao: '[INSERIR ENDEREÇO / PONTO DE ENCONTRO]', ativo: true },
    { id: 'l3', nome: 'Local 3 — [INSERIR CIDADE]', regiao: 'Sul', descricao: '[INSERIR ENDEREÇO / PONTO DE ENCONTRO]', ativo: true },
  ]
  const jetskis = [
    { id: 'j1', marca: 'Sea-Doo', modelo: 'GTI 130', ano: 2024, categoria: 'Recreação', potencia: '130 hp', capacidade: 3, cor: 'Branco / Azul', velMax: '~80 km/h', precoHora: 250, precoPeriodo: 900, precoDiaria: 1600, caucao: 500, localId: 'l1', status: 'disponivel', horasUso: 120, identificacao: 'LJ-01', hue: 200,
      descricao: 'Estável, fácil de pilotar e perfeito para quem vai pilotar pela primeira vez. Ideal para passeios em família e casais.',
      caracteristicas: ['Ré e neutro eletrônicos', 'Modo ECO', 'Plataforma ampla', 'Porta-objetos estanque'],
      regras: ['Piloto com Arrais Amador ou acompanhado de instrutor', 'Uso obrigatório de colete', 'Proibido pilotar sob efeito de álcool'] },
    { id: 'j2', marca: 'Yamaha', modelo: 'VX Cruiser', ano: 2023, categoria: 'Touring', potencia: '125 hp', capacidade: 3, cor: 'Preto / Ciano', velMax: '~85 km/h', precoHora: 280, precoPeriodo: 1000, precoDiaria: 1800, caucao: 600, localId: 'l2', status: 'disponivel', horasUso: 210, identificacao: 'LJ-02', hue: 185,
      descricao: 'Banco confortável para três pessoas e ótima autonomia. Para quem quer explorar a represa com calma e conforto.',
      caracteristicas: ['Assento touring', 'Controle de cruzeiro', 'Sistema de som opcional', 'Grande autonomia'],
      regras: ['Piloto com Arrais Amador ou acompanhado de instrutor', 'Uso obrigatório de colete', 'Respeitar a área demarcada'] },
    { id: 'j3', marca: 'Sea-Doo', modelo: 'RXP-X 300', ano: 2024, categoria: 'Performance', potencia: '300 hp', capacidade: 2, cor: 'Amarelo / Preto', velMax: '~110 km/h', precoHora: 450, precoPeriodo: 1600, precoDiaria: 2800, caucao: 1500, localId: 'l1', status: 'disponivel', horasUso: 64, identificacao: 'LJ-03', hue: 45,
      descricao: 'Adrenalina pura. Aceleração intensa e curvas precisas para pilotos experientes que buscam velocidade.',
      caracteristicas: ['Motor sobrealimentado', 'Casco esportivo', 'Modo Sport', 'Trim ajustável'],
      regras: ['Somente pilotos habilitados (Arrais Amador)', 'Idade mínima 21 anos', 'Uso obrigatório de colete'] },
    { id: 'j4', marca: 'Kawasaki', modelo: 'STX 160', ano: 2023, categoria: 'Recreação', potencia: '160 hp', capacidade: 3, cor: 'Verde / Branco', velMax: '~90 km/h', precoHora: 300, precoPeriodo: 1100, precoDiaria: 1900, caucao: 700, localId: 'l3', status: 'manutencao', horasUso: 340, identificacao: 'LJ-04', hue: 150,
      descricao: 'Equilíbrio entre potência e conforto. Ótimo para passeios em grupo e fotos incríveis na água.',
      caracteristicas: ['Ótima estabilidade', 'Retrovisores amplos', 'Plataforma de embarque'],
      regras: ['Piloto com Arrais Amador ou acompanhado de instrutor', 'Uso obrigatório de colete'] },
  ]
  const services = [
    { id: 's1', nome: 'Passeio acompanhado', descricao: 'Instrutor acompanha você durante todo o passeio.', preco: 150, icon: '🧭', ativo: true },
    { id: 's2', nome: 'Fotografia', descricao: 'Fotos profissionais da sua experiência.', preco: 120, icon: '📸', ativo: true },
    { id: 's3', nome: 'Filmagem com drone', descricao: 'Vídeo aéreo editado para você postar.', preco: 250, icon: '🎥', ativo: true },
    { id: 's4', nome: 'Combustível adicional', descricao: 'Tanque extra para passeios longos.', preco: 100, icon: '⛽', ativo: true },
    { id: 's5', nome: 'Decoração especial', descricao: 'Para pedidos de namoro, aniversários e surpresas.', preco: 180, icon: '🎉', ativo: true },
  ]
  const experiences = [
    { id: 'e1', nome: 'Locação individual', descricao: 'Você no comando. Pilote no seu ritmo pela área demarcada.', icon: '🌊', preco: 0, ativo: true },
    { id: 'e2', nome: 'Experiência VIP', descricao: 'Atendimento exclusivo, bebidas, toalhas e prioridade de horário.', icon: '👑', preco: 150, ativo: true },
    { id: 'e3', nome: 'Passeio acompanhado', descricao: 'Ideal para iniciantes: um instrutor guia todo o percurso.', icon: '🧭', preco: 120, ativo: true },
    { id: 'e4', nome: 'Experiência para casal', descricao: 'Um momento a dois com pôr do sol e fotos.', icon: '💞', preco: 100, ativo: true },
    { id: 'e5', nome: 'Experiência em grupo', descricao: 'Vários Jet Skis para amigos, família ou empresa.', icon: '🚤', preco: 0, ativo: true },
    { id: 'e6', nome: 'Experiência personalizada', descricao: 'Monte do seu jeito: data, roteiro e surpresas.', icon: '✨', preco: 0, ativo: true },
  ]
  const clients = [
    { id: 'c1', nome: 'Cliente Exemplo 1', email: 'cliente1@exemplo.com', telefone: '(62) 90000-0001', whatsapp: '5562900000001', cidade: '[CIDADE]', estado: 'GO', status: 'ativo', createdAt: addDays(-40), pontos: 320, refCode: 'AMIGO-C1', exemplo: true },
    { id: 'c2', nome: 'Cliente Exemplo 2', email: 'cliente2@exemplo.com', telefone: '(62) 90000-0002', whatsapp: '5562900000002', cidade: '[CIDADE]', estado: 'GO', status: 'ativo', createdAt: addDays(-12), pontos: 90, refCode: 'AMIGO-C2', indicadoPor: 'c1', exemplo: true },
    { id: 'c3', nome: 'Cliente Exemplo 3', email: 'cliente3@exemplo.com', telefone: '(62) 90000-0003', whatsapp: '5562900000003', cidade: '[CIDADE]', estado: 'GO', status: 'ativo', createdAt: addDays(-3), pontos: 0, refCode: 'AMIGO-C3', exemplo: true },
  ]
  const mk = (code, clientId, jetId, d, hora, dur, status, pag, total) => ({ id: code, clientId, jetId, data: addDays(d), hora, duracao: dur, pessoas: 2, localId: 'l1', servicos: [], experienciaId: 'e1', subtotal: total, adicionais: 0, desconto: 0, taxas: 0, caucao: 500, total, status, pagamento: pag, obs: '', createdAt: addDays(Math.min(d, 0) - 2), exemplo: true })
  const reservations = [
    mk('LJ-A1B2C3', 'c1', 'j1', -20, '09:00', 2, 'concluida', 'pago', 500),
    mk('LJ-D4E5F6', 'c1', 'j3', -9, '14:00', 1, 'concluida', 'pago', 450),
    mk('LJ-G7H8J9', 'c2', 'j2', -2, '10:00', 3, 'concluida', 'pago', 840),
    mk('LJ-K1L2M3', 'c3', 'j1', 0, '15:00', 2, 'confirmada', 'pago', 500),
    mk('LJ-N4P5Q6', 'c2', 'j2', 2, '09:00', 4, 'aguardando_confirmacao', 'pendente', 1000),
    mk('LJ-R7S8T9', 'c1', 'j3', 5, '16:00', 1, 'aguardando_atendimento', 'pendente', 450),
  ]
  return {
    settings: { whatsapp: SITE.whatsapp, abertura: 8, fechamento: 18, taxa: 0, demo: true },
    locations, jetskis, services, experiences, clients, reservations,
    rentals: [{ id: uid(), reservaId: 'LJ-G7H8J9', jetId: 'j2', clientId: 'c2', saida: '10:05', retorno: '13:02', horas: 3, caucao: 'devolvida', danos: 'Nenhum', obs: '', exemplo: true }],
    expenses: [{ id: uid(), descricao: 'Combustível (exemplo)', valor: 380, data: addDays(-5), jetId: 'j1' }, { id: uid(), descricao: 'Revisão (exemplo)', valor: 950, data: addDays(-15), jetId: 'j4' }],
    maintenance: [{ id: uid(), jetId: 'j4', data: today(), horasUso: 340, tipo: 'Revisão de 300h', descricao: 'Troca de óleo, velas e verificação da turbina', custo: 950, responsavel: '[RESPONSÁVEL]', proxima: addDays(60), status: 'em_andamento' }],
    coupons: [{ id: uid(), codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, validade: addDays(90), limite: 100, usos: 0, minimo: 200, jets: [], ativo: true }],
    reviews: [{ id: uid(), clientId: 'c1', reservaId: 'LJ-A1B2C3', atendimento: 5, jetski: 5, experiencia: 5, facilidade: 4, geral: 5, comentario: 'Avaliação de exemplo — substitua por avaliações reais.', resposta: '', visivel: true, data: addDays(-19), exemplo: true }],
    notifications: [{ id: uid(), tipo: 'reserva', texto: 'Nova reserva LJ-R7S8T9 aguardando atendimento', data: new Date().toISOString(), lida: false }, { id: uid(), tipo: 'manutencao', texto: 'LJ-04 (Kawasaki STX 160) em manutenção', data: new Date().toISOString(), lida: false }],
    contracts: [],
    abandoned: [],
    users: [
      { id: 'u1', nome: 'Proprietário', email: 'admin@locajett.com', senha: 'admin123', papel: 'proprietario', ativo: true },
      { id: 'u2', nome: 'Atendente (exemplo)', email: 'atendente@locajett.com', senha: 'atend123', papel: 'atendente', ativo: true },
    ],
    cart: null,
    session: { clientId: null, adminId: null },
  }
}

let db
try { db = JSON.parse(localStorage.getItem(KEY)) || seed() } catch { db = seed() }
const listeners = new Set()
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {} }
export const getDB = () => db
export const setDB = (fn) => { db = { ...db, ...fn(db) }; persist(); listeners.forEach((l) => l()) }
export const resetDB = () => { db = seed(); persist(); listeners.forEach((l) => l()) }
export const clearExamples = () => setDB((d) => ({
  clients: d.clients.filter((c) => !c.exemplo), reservations: d.reservations.filter((r) => !r.exemplo),
  rentals: d.rentals.filter((r) => !r.exemplo), reviews: d.reviews.filter((r) => !r.exemplo), expenses: [], notifications: [],
  settings: { ...d.settings, demo: false },
}))
export const useDB = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => db)

// ---------- CRUD genérico ----------
export const upsert = (table, item) => setDB((d) => {
  const list = d[table] || []
  if (item.id && list.some((x) => x.id === item.id)) return { [table]: list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) }
  return { [table]: [...list, { ...item, id: item.id || uid() }] }
})
export const remove = (table, id) => setDB((d) => ({ [table]: d[table].filter((x) => x.id !== id) }))
export const notify = (tipo, texto) => setDB((d) => ({ notifications: [{ id: uid(), tipo, texto, data: new Date().toISOString(), lida: false }, ...d.notifications] }))

// ---------- Helpers ----------
export const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
export const weekday = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
export const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c
  do { c = 'LJ-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') } while (db.reservations.some((r) => r.id === c))
  return c
}
export const whatsNumber = () => (db.settings.whatsapp || SITE.whatsapp || '').replace(/\D/g, '')
export const waLink = (number, text) => `https://wa.me/${(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

export const STATUS = {
  aguardando_atendimento: { label: 'Aguardando atendimento', tone: 'info' },
  aguardando_confirmacao: { label: 'Aguardando confirmação', tone: 'warning' },
  confirmada: { label: 'Confirmada', tone: 'success' },
  pagamento_pendente: { label: 'Pagamento pendente', tone: 'warning' },
  pagamento_confirmado: { label: 'Pagamento confirmado', tone: 'success' },
  em_andamento: { label: 'Em andamento', tone: 'accent' },
  concluida: { label: 'Concluída', tone: 'muted' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
}
export const JET_STATUS = {
  disponivel: { label: 'Disponível', tone: 'success' }, reservado: { label: 'Reservado', tone: 'warning' },
  em_uso: { label: 'Em uso', tone: 'accent' }, manutencao: { label: 'Manutenção', tone: 'danger' }, indisponivel: { label: 'Indisponível', tone: 'muted' },
}
export const DURACOES = [
  { h: 1, label: '1 hora' }, { h: 2, label: '2 horas' }, { h: 3, label: '3 horas' }, { h: 4, label: 'Meio período (4h)' }, { h: 8, label: 'Diária (8h)' },
]
export const jetPrice = (jet, h) => (!jet ? 0 : h >= 8 ? jet.precoDiaria : h === 4 ? jet.precoPeriodo : jet.precoHora * h)

// Horários livres de um Jet Ski em uma data (impede conflitos)
export const slotsFor = (jetId, date, dur = 1, ignoreId) => {
  const { abertura, fechamento } = db.settings
  const jet = db.jetskis.find((j) => j.id === jetId)
  if (!jet || ['manutencao', 'indisponivel'].includes(jet.status)) return []
  const busy = db.reservations.filter((r) => r.jetId === jetId && r.data === date && r.status !== 'cancelada' && r.id !== ignoreId)
  const now = new Date()
  const out = []
  for (let h = abertura; h + Math.min(dur, fechamento - abertura) <= fechamento; h++) {
    for (const m of [0, 30]) {
      const start = h + m / 60, end = start + dur
      if (end > fechamento) continue
      if (date === today() && start <= now.getHours() + now.getMinutes() / 60) continue
      const conflict = busy.some((r) => { const [rh, rm] = r.hora.split(':').map(Number); const rs = rh + rm / 60; return start < rs + r.duracao && rs < end })
      if (!conflict) out.push(`${String(h).padStart(2, '0')}:${m ? '30' : '00'}`)
    }
  }
  return out
}
export const dayState = (jetId, date) => {
  const jet = db.jetskis.find((j) => j.id === jetId)
  if (!jet) return 'indisponivel'
  if (jet.status === 'manutencao') return 'manutencao'
  if (jet.status === 'indisponivel' || date < today()) return 'indisponivel'
  if (date === today() && db.reservations.some((r) => r.jetId === jetId && r.data === date && r.status === 'em_andamento')) return 'em_uso'
  return slotsFor(jetId, date, 1).length ? 'disponivel' : 'reservado'
}

// ---------- Carrinho "Minha Reserva" ----------
export const emptyCart = () => ({ jetId: null, data: '', hora: '', duracao: 2, pessoas: 1, localId: '', servicos: [], experienciaId: 'e1', cupom: '', cliente: {}, startedAt: new Date().toISOString() })
export const updateCart = (patch) => setDB((d) => ({ cart: { ...(d.cart || emptyCart()), ...patch } }))
export const clearCart = () => setDB(() => ({ cart: null }))
export const cartCount = (cart) => (cart && cart.jetId ? 1 + cart.servicos.length + (cart.experienciaId && cart.experienciaId !== 'e1' ? 1 : 0) : 0)

export const findCoupon = (code, base, jetId) => {
  const c = db.coupons.find((x) => x.ativo && x.codigo.toUpperCase() === (code || '').trim().toUpperCase())
  if (!c) return null
  if (c.validade && c.validade < today()) return null
  if (c.limite && c.usos >= c.limite) return null
  if (c.minimo && base < c.minimo) return null
  const jets = c.jets?.length ? c.jets : (c.jetsTxt || '').split(',').map((x) => x.trim()).filter(Boolean)
  if (jets.length && !jets.includes(jetId)) return null
  return c
}
export const calcCart = (cart) => {
  const d = db
  if (!cart?.jetId) return { jet: null, base: 0, adicionais: 0, desconto: 0, taxas: 0, total: 0, caucao: 0, itens: [] }
  const jet = d.jetskis.find((j) => j.id === cart.jetId)
  const base = jetPrice(jet, cart.duracao)
  const servs = d.services.filter((s) => cart.servicos.includes(s.id))
  const exp = d.experiences.find((e) => e.id === cart.experienciaId)
  const itens = [...servs.map((s) => ({ nome: s.nome, preco: s.preco, icon: s.icon })), ...(exp && exp.preco ? [{ nome: exp.nome, preco: exp.preco, icon: exp.icon }] : [])]
  const adicionais = itens.reduce((a, i) => a + i.preco, 0)
  const coupon = findCoupon(cart.cupom, base + adicionais, jet?.id)
  const desconto = coupon ? (coupon.tipo === 'percentual' ? Math.round((base + adicionais) * coupon.valor) / 100 : coupon.valor) : 0
  const taxas = Number(d.settings.taxa) || 0
  return { jet, exp, base, itens, adicionais, coupon, desconto, taxas, caucao: jet?.caucao || 0, total: Math.max(0, base + adicionais - desconto + taxas) }
}

export const buildWhatsMessage = (r, client) => {
  const d = db
  const jet = d.jetskis.find((j) => j.id === r.jetId)
  const loc = d.locations.find((l) => l.id === r.localId)
  const servs = d.services.filter((s) => r.servicos.includes(s.id))
  const exp = d.experiences.find((e) => e.id === r.experienciaId)
  const lines = [
    '*NOVA RESERVA — LOCA JETT OFICIAL*', '', `Reserva nº ${r.id}`, '',
    '👤 *CLIENTE*', '', `Nome: ${client.nome}`, `E-mail: ${client.email}`, `WhatsApp: ${client.telefone}`, '',
    '🌊 *JET SKI*', '', `• Marca: ${jet?.marca}`, `• Modelo: ${jet?.modelo}`, `• Capacidade: ${jet?.capacidade} pessoas`, `• Período: ${r.duracao} ${r.duracao > 1 ? 'horas' : 'hora'}`, '',
    '📅 *RESERVA*', '', `• Data: ${weekday(r.data)}, ${fmtDate(r.data)}`, `• Horário: ${r.hora}`, `• Duração: ${r.duracao} ${r.duracao > 1 ? 'horas' : 'hora'}`, `• Local: ${loc?.nome || '-'}`, `• Pessoas: ${r.pessoas}`, `• Experiência: ${exp?.nome || '-'}`, '',
  ]
  if (servs.length || (exp && exp.preco)) {
    lines.push('✨ *SERVIÇOS ADICIONAIS*', '')
    servs.forEach((s) => lines.push(`• ${s.nome} — ${brl(s.preco)}`))
    if (exp && exp.preco) lines.push(`• ${exp.nome} — ${brl(exp.preco)}`)
    lines.push('')
  }
  lines.push('💰 *RESUMO*', '', `Jet Ski: ${brl(r.subtotal)}`, `Adicionais: ${brl(r.adicionais)}`, `Desconto: -${brl(r.desconto)}`, `Taxas: ${brl(r.taxas)}`, `Caução (devolvível): ${brl(r.caucao)}`, '', `*TOTAL: ${brl(r.total)}*`, '',
    '💳 *PAGAMENTO*', '', 'Status: Aguardando confirmação', '')
  if (r.obs) lines.push('📝 *OBSERVAÇÕES*', '', r.obs, '')
  lines.push('Reserva criada pelo site da Loca Jett Oficial.', '', 'Favor confirmar disponibilidade e os próximos passos.')
  return lines.join('\n')
}

export const sha256 = async (s) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const ROLES = {
  proprietario: { label: 'Proprietário', modules: '*' },
  gerente: { label: 'Gerente', modules: ['dashboard', 'jet-skis', 'clientes', 'reservas', 'locacoes', 'calendario', 'pagamentos', 'financeiro', 'relatorios', 'contratos', 'promocoes', 'fidelidade', 'indicacoes', 'avaliacoes', 'notificacoes', 'manutencao'] },
  atendente: { label: 'Atendente', modules: ['dashboard', 'clientes', 'reservas', 'calendario', 'notificacoes', 'avaliacoes'] },
  operacional: { label: 'Operacional', modules: ['dashboard', 'jet-skis', 'manutencao', 'locacoes', 'calendario', 'notificacoes'] },
}
export const can = (user, mod) => user && (ROLES[user.papel]?.modules === '*' || ROLES[user.papel]?.modules.includes(mod))
export const tier = (pontos) => (pontos >= 2000 ? 'VIP' : pontos >= 1000 ? 'Ouro' : pontos >= 400 ? 'Prata' : 'Bronze')
