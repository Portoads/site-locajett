import { useSyncExternalStore } from 'react'
import { seedDB, DEFAULT_SETTINGS, conflicts, calcPrice, couponValid, rangeEnd, genCode as genCodeS, PAGAMENTO, addDaysISO } from './shared'

// ------------------------------------------------------------------
// Estado do site.
// • Com a API configurada (Vercel Blob), Jet Skis, preços, bloqueios,
//   configurações e reservas vêm do servidor (/api/*) e valem para todos.
// • Sem API (ex.: rodando local), funciona em modo demonstração usando
//   o localStorage do navegador.
// ------------------------------------------------------------------
const KEY = 'locajett_db_v2'
const uid = () => Math.random().toString(36).slice(2, 10)
export const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const today = () => localISO(new Date())
export { rangeEnd, addDaysISO, PAGAMENTO }

const LOCAL_ONLY = ['cart', 'session']
const fresh = () => ({ ...seedDB(), busy: [], remote: false, cart: null, session: { clientId: null, adminId: null } })

let db
try {
  const saved = JSON.parse(localStorage.getItem(KEY))
  db = saved ? { ...fresh(), ...saved, settings: { ...DEFAULT_SETTINGS, ...(saved.settings || {}) } } : fresh()
} catch { db = fresh() }
const listeners = new Set()
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {} }
export const getDB = () => db
export const setDB = (fn) => {
  const patch = fn(db)
  db = { ...db, ...patch }
  persist(); listeners.forEach((l) => l())
  if (adminToken() && Object.keys(patch).some((k) => !LOCAL_ONLY.includes(k) && k !== 'busy' && k !== 'remote')) scheduleAdminSave()
}
export const resetDB = () => { db = { ...fresh(), session: db.session }; persist(); listeners.forEach((l) => l()); if (adminToken()) scheduleAdminSave() }
export const clearExamples = () => setDB((d) => ({ clients: d.clients.filter((c) => !c.exemplo), reservations: d.reservations.filter((r) => !r.exemplo), reviews: d.reviews.filter((r) => !r.exemplo), settings: { ...d.settings, demo: false } }))
export const useDB = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => db)

// ---------- CRUD genérico ----------
export const upsert = (table, item) => setDB((d) => {
  const list = d[table] || []
  if (item.id && list.some((x) => x.id === item.id)) return { [table]: list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) }
  return { [table]: [...list, { ...item, id: item.id || uid() }] }
})
const MERGE = ['reservations', 'clients', 'notifications']
export const remove = (table, id) => setDB((d) => ({ [table]: d[table].filter((x) => x.id !== id), ...(MERGE.includes(table) ? { ['_removed_' + table]: [...(d['_removed_' + table] || []), id] } : {}) }))
export const notify = (tipo, texto) => setDB((d) => ({ notifications: [{ id: uid(), tipo, texto, data: new Date().toISOString(), lida: false }, ...d.notifications].slice(0, 300) }))

// ---------- API (servidor) ----------
const api = async (path, opts = {}) => {
  const r = await fetch('/api/' + path, { ...opts, headers: { 'content-type': 'application/json', ...(adminToken() ? { authorization: 'Bearer ' + adminToken() } : {}), ...(opts.headers || {}) } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error || 'Erro ' + r.status), { status: r.status, data: j })
  return j
}
export const loadRemote = async () => {
  try {
    const j = await api('public')
    if (!j.ok) return
    db = { ...db, ...j.tables, settings: { ...DEFAULT_SETTINGS, ...j.settings }, busy: j.busy || [], remote: true }
    persist(); listeners.forEach((l) => l())
  } catch { /* sem API: modo local */ }
}
export const checkCouponRemote = async (code, jetId, base) => {
  if (!db.remote || !code) return
  try { const j = await api(`coupon?code=${encodeURIComponent(code)}&jet=${encodeURIComponent(jetId || '')}&base=${base}`); setDB((d) => ({ couponInfo: { ...(d.couponInfo || {}), [code.toUpperCase()]: j.coupon || null } })) } catch { setDB((d) => ({ couponInfo: { ...(d.couponInfo || {}), [code.toUpperCase()]: null } })) }
}
export const submitReservationRemote = (payload) => api('reserve', { method: 'POST', body: JSON.stringify(payload) })

// Admin
export const adminToken = () => { try { return sessionStorage.getItem('lj_admin') || '' } catch { return '' } }
export const adminLogin = async (email, senha) => {
  const j = await api('admin', { method: 'POST', body: JSON.stringify({ action: 'login', email, senha }) })
  try { sessionStorage.setItem('lj_admin', j.token) } catch {}
  await adminPull()
  return j.user
}
export const adminLogout = () => { try { sessionStorage.removeItem('lj_admin') } catch {} }
export const adminPull = async () => {
  const j = await api('admin', { method: 'POST', body: JSON.stringify({ action: 'get' }) })
  db = { ...db, ...j.db, settings: { ...DEFAULT_SETTINGS, ...(j.db.settings || {}) }, remote: true }
  persist(); listeners.forEach((l) => l())
}
let saveTimer, saving = Promise.resolve()
export let syncState = 'ok'
const scheduleAdminSave = () => {
  if (!db.remote) return
  clearTimeout(saveTimer); syncState = 'pendente'
  saveTimer = setTimeout(() => {
    const payload = Object.fromEntries(Object.entries(db).filter(([k]) => !['cart', 'session', 'busy', 'remote', 'couponInfo'].includes(k)))
    saving = saving.then(() => api('admin', { method: 'POST', body: JSON.stringify({ action: 'save', db: payload }) })
      .then((j) => { syncState = 'ok'; if (j.db) { MERGE.forEach((t) => delete db['_removed_' + t]); db = { ...db, ...j.db, settings: { ...DEFAULT_SETTINGS, ...j.db.settings } }; persist(); listeners.forEach((l) => l()) } })
      .catch((e) => { syncState = 'erro'; console.error('Falha ao salvar no servidor', e); if (e.status === 401) adminLogout() }))
  }, 700)
}

// ---------- Helpers ----------
export const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
export const weekday = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
export const genCode = () => genCodeS((c) => db.reservations.some((r) => r.id === c))
export const whatsNumber = () => String(db.settings.whatsapp || '').replace(/\D/g, '')
export const waLink = (number, text) => `https://wa.me/${String(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
export const diariasLabel = (n) => `${n} diária${n > 1 ? 's' : ''}`

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
export const SALE_STATUS = { disponivel: { label: 'À venda', tone: 'success' }, reservado: { label: 'Negociando', tone: 'warning' }, vendido: { label: 'Vendido', tone: 'muted' } }

// Faixas ocupadas = reservas conhecidas (servidor + locais)
export const ranges = () => {
  const map = new Map()
  db.busy.forEach((b) => map.set(b.id, b))
  db.reservations.forEach((r) => map.set(r.id, { id: r.id, jetId: r.jetId, data: r.data, dataFim: r.dataFim || r.data, status: r.status }))
  return [...map.values()]
}
export const rangeConflict = (jetId, start, diarias, ignoreId) => conflicts({ ranges: ranges(), bloqueios: db.bloqueios }, jetId, start, diarias, ignoreId)
export const dayState = (jetId, date) => {
  const jet = db.jetskis.find((j) => j.id === jetId)
  if (!jet) return 'indisponivel'
  if (jet.status === 'manutencao') return 'manutencao'
  if (jet.status === 'indisponivel' || date < today()) return 'indisponivel'
  const c = rangeConflict(jetId, date, 1)
  if (c?.tipo === 'bloqueio') return 'indisponivel'
  if (c) return date === today() ? 'em_uso' : 'reservado'
  return 'disponivel'
}
// Máximo de diárias livres a partir de uma data
export const maxDiarias = (jetId, start) => {
  const lim = Number(db.settings.diariasMax) || 15
  let n = 0
  while (n < lim && start && !rangeConflict(jetId, addDaysISO(start, n), 1)) n++
  return n
}

// ---------- Carrinho "Minha Reserva" ----------
export const emptyCart = () => ({ jetId: null, data: '', diarias: 1, pessoas: 1, localId: 'l1', servicos: [], experienciaId: 'e1', cupom: '', formaPagamento: 'pix', cliente: {}, startedAt: new Date().toISOString() })
export const updateCart = (patch) => setDB((d) => ({ cart: { ...emptyCart(), ...(d.cart || {}), ...patch } }))
export const clearCart = () => setDB(() => ({ cart: null }))
export const cartCount = (cart) => (cart && cart.jetId ? 1 + (cart.servicos || []).length : 0)

export const findCoupon = (code, base, jetId) => {
  if (!code) return null
  const k = code.trim().toUpperCase()
  if (db.remote) { const c = db.couponInfo?.[k]; return c && couponValid({ ...c, ativo: true }, base, jetId, today()) ? c : null }
  const c = db.coupons.find((x) => x.codigo.toUpperCase() === k)
  return couponValid(c, base, jetId, today()) ? c : null
}
export const calcCart = (cart) => {
  if (!cart?.jetId) return { jet: null, base: 0, adicionais: 0, desconto: 0, taxas: 0, total: 0, entrada: 0, restante: 0, caucao: 0, itens: [] }
  const jet = db.jetskis.find((j) => j.id === cart.jetId)
  const services = db.services.filter((s) => (cart.servicos || []).includes(s.id))
  const exp = db.experiences.find((e) => e.id === cart.experienciaId)
  const pre = calcPrice({ jet, diarias: cart.diarias, services, experience: exp, settings: db.settings })
  const coupon = findCoupon(cart.cupom, pre.base + pre.adicionais, jet?.id)
  return { jet, exp, coupon, dataFim: cart.data ? rangeEnd(cart.data, cart.diarias) : '', ...calcPrice({ jet, diarias: cart.diarias, services, experience: exp, coupon, settings: db.settings }) }
}

export const buildWhatsMessage = (r, client) => {
  const jet = db.jetskis.find((j) => j.id === r.jetId)
  const loc = db.locations.find((l) => l.id === r.localId)
  const servs = db.services.filter((s) => (r.servicos || []).includes(s.id))
  const s = db.settings
  const lines = [
    '*NOVA RESERVA — LOCA JETT OFICIAL*', '', `Reserva nº ${r.id}`, '',
    '👤 *CLIENTE*', '', `Nome: ${client.nome}`, `E-mail: ${client.email}`, `WhatsApp: ${client.telefone}`, '',
    '🌊 *JET SKI*', '', `• Marca: ${jet?.marca}`, `• Modelo: ${jet?.modelo}`, ...(jet?.capacidade ? [`• Capacidade: ${jet.capacidade} pessoas`] : []), '',
    '📅 *RESERVA*', '', `• Início: ${weekday(r.data)}, ${fmtDate(r.data)}`, `• Diárias: ${r.diarias}`, `• Término: ${weekday(r.dataFim)}, ${fmtDate(r.dataFim)}`, `• Local: ${loc?.nome || '-'}`, ...(r.pessoas ? [`• Pessoas: ${r.pessoas}`] : []), '',
  ]
  if (servs.length) { lines.push('✨ *SERVIÇOS ADICIONAIS*', ''); servs.forEach((x) => lines.push(`• ${x.nome} — ${brl(x.preco)}`)); lines.push('') }
  lines.push('💰 *RESUMO*', '', `Jet Ski (${diariasLabel(r.diarias)}): ${brl(r.subtotal)}`)
  if (r.adicionais) lines.push(`Adicionais: ${brl(r.adicionais)}`)
  if (r.desconto) lines.push(`Desconto${r.cupom ? ' (' + r.cupom + ')' : ''}: -${brl(r.desconto)}`)
  if (r.taxas) lines.push(`Taxas: ${brl(r.taxas)}`)
  lines.push('', `*TOTAL: ${brl(r.total)}*`, '',
    '💳 *PAGAMENTO*', '', `Entrada (${r.entradaPct ?? s.entradaPct}%): *${brl(r.entrada)}*`, `Restante: ${brl(r.restante)}`, `Forma de pagamento: ${PAGAMENTO[r.formaPagamento] || '-'}`, 'Status: Aguardando pagamento da entrada', '')
  if (r.obs) lines.push('📝 *OBSERVAÇÕES*', '', r.obs, '')
  lines.push('Reserva criada pelo site da Loca Jett Oficial.', '', 'Favor confirmar disponibilidade e enviar os dados para pagamento da entrada.')
  return lines.join('\n')
}

export const sha256 = async (s) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const ROLES = {
  proprietario: { label: 'Proprietário', modules: '*' },
  gerente: { label: 'Gerente', modules: ['dashboard', 'jet-skis', 'venda', 'clientes', 'reservas', 'bloqueios', 'locacoes', 'calendario', 'pagamentos', 'financeiro', 'relatorios', 'contratos', 'promocoes', 'fidelidade', 'indicacoes', 'avaliacoes', 'notificacoes', 'manutencao'] },
  atendente: { label: 'Atendente', modules: ['dashboard', 'clientes', 'reservas', 'calendario', 'bloqueios', 'notificacoes', 'avaliacoes', 'venda'] },
  operacional: { label: 'Operacional', modules: ['dashboard', 'jet-skis', 'manutencao', 'locacoes', 'calendario', 'bloqueios', 'notificacoes'] },
}
export const can = (user, mod) => user && (ROLES[user.papel]?.modules === '*' || ROLES[user.papel]?.modules.includes(mod))
export const tier = (pontos) => (pontos >= 2000 ? 'VIP' : pontos >= 1000 ? 'Ouro' : pontos >= 400 ? 'Prata' : 'Bronze')

// Compacta imagem enviada pelo admin (vira data URL WebP leve)
export const compressImage = (file, max = 1000, q = 0.78) => new Promise((res, rej) => {
  const img = new Image(); const url = URL.createObjectURL(file)
  img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/webp', q)) }
  img.onerror = rej; img.src = url
})
