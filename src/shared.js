// ------------------------------------------------------------------
// Regras de negócio compartilhadas entre o site (navegador) e a API
// (Vercel Functions em /api). Sem dependências de React/DOM.
// ------------------------------------------------------------------

export const addDaysISO = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const rangeEnd = (start, diarias) => addDaysISO(start, Math.max(1, diarias) - 1)
export const overlaps = (aS, aE, bS, bE) => aS <= bE && bS <= aE
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000)

// ranges = [{ jetId, data, dataFim, id, status }]
export const conflicts = ({ ranges = [], bloqueios = [] }, jetId, start, diarias, ignoreId) => {
  const end = rangeEnd(start, diarias)
  const r = ranges.find((x) => x.jetId === jetId && x.status !== 'cancelada' && x.id !== ignoreId && overlaps(start, end, x.data, x.dataFim || x.data))
  if (r) return { tipo: 'reserva', item: r }
  const b = bloqueios.find((x) => (x.jetId === '*' || x.jetId === jetId) && overlaps(start, end, x.inicio, x.fim || x.inicio))
  if (b) return { tipo: 'bloqueio', item: b }
  return null
}

export const couponValid = (c, base, jetId, todayISO) => {
  if (!c || !c.ativo) return false
  if (c.validade && c.validade < todayISO) return false
  if (c.limite && (c.usos || 0) >= c.limite) return false
  if (c.minimo && base < c.minimo) return false
  const jets = c.jets?.length ? c.jets : String(c.jetsTxt || '').split(',').map((x) => x.trim()).filter(Boolean)
  if (jets.length && !jets.includes(jetId)) return false
  return true
}

// Valor da locação: somente por diária (mínimo 1)
export const calcPrice = ({ jet, diarias = 1, services = [], experience = null, coupon = null, settings = {} }) => {
  const d = Math.max(1, Math.floor(Number(diarias) || 1))
  const base = (Number(jet?.precoDiaria) || 0) * d
  const itens = [...services.map((s) => ({ nome: s.nome, preco: Number(s.preco) || 0, icon: s.icon })), ...(experience && experience.preco ? [{ nome: experience.nome, preco: Number(experience.preco), icon: experience.icon }] : [])]
  const adicionais = itens.reduce((a, i) => a + i.preco, 0)
  const desconto = coupon ? (coupon.tipo === 'percentual' ? Math.round((base + adicionais) * coupon.valor) / 100 : Number(coupon.valor) || 0) : 0
  const taxas = Number(settings.taxa) || 0
  const total = Math.max(0, base + adicionais - desconto + taxas)
  const pct = Number(settings.entradaPct ?? 50)
  const entrada = Math.round(total * pct) / 100
  const original = (Number(jet?.precoOriginal) || 0) * d
  return { diarias: d, base, original, economia: original > base ? original - base : 0, itens, adicionais, desconto, taxas, total, entrada, restante: Math.round((total - entrada) * 100) / 100, caucao: Number(jet?.caucao) || 0, entradaPct: pct }
}

export const genCode = (exists = () => false) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c
  do { c = 'LJ-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') } while (exists(c))
  return c
}

export const brlS = (v) => 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const fmtDateS = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
export const PAGAMENTO = { pix: 'Pix', cartao: 'Cartão' }

// Configurações padrão (tudo ajustável no painel › Configurações)
export const DEFAULT_SETTINGS = {
  whatsapp: '5562981047747',
  telefone: '(62) 98104-7747',
  instagram: '@locajetoficial',
  instagramUrl: 'https://www.instagram.com/locajetoficial',
  adminEmail: '',
  pixChave: '',
  cartaoLink: '',
  cartaoPlataforma: '',
  endereco: '',
  mapsUrl: '',
  cidade: 'Goiânia — Goiás',
  horarioRetirada: '',
  horarioDevolucao: '',
  diasFuncionamento: '',
  cancelamento: '',
  chuva: '',
  documentos: 'Documento oficial com foto (RG ou CNH)',
  seguranca: 'Uso obrigatório de colete salva-vidas. Proibido pilotar sob efeito de álcool.',
  idadeMinima: 18,
  exigeHabilitacao: true,
  textoHabilitacao: 'Para pilotar, provavelmente será necessária a habilitação de Motonauta (Arrais Amador). A confirmar com a Loca Jett.',
  entradaPct: 50,
  diariasMax: 15,
  taxa: 0,
  demo: false,
}

export const seedDB = () => ({
  settings: { ...DEFAULT_SETTINGS },
  locations: [{ id: 'l1', nome: 'Goiânia — Goiás', regiao: 'Centro', descricao: 'Ponto de retirada: [INSERIR ENDEREÇO]. De norte a sul do estado, a sua diversão está garantida!', ativo: true }],
  jetskis: [
    { id: 'gti-170', marca: 'Sea-Doo', modelo: 'GTI 170', ano: '2024/2025', categoria: 'Recreação', potencia: '170 hp', capacidade: '', cor: 'Azul-petróleo / Branco', velMax: '', precoOriginal: 1800, precoDiaria: 1250, caucao: 0, localId: 'l1', status: 'disponivel', horasUso: 0, identificacao: 'JET 170', hue: 190,
      fotos: ['/img/gti-170.webp'],
      descricao: 'Modelo novo e de alta performance. Estável, confortável e fácil de pilotar — perfeito para curtir o dia na água com quem você gosta.',
      caracteristicas: ['Modelo 2024/2025', 'Novo e de alta performance', 'Diárias e pacotes sob medida', 'Combustível não incluso'],
      regras: ['Locação somente por diária (mínimo 1 diária)', 'Idade mínima de 18 anos', 'Uso obrigatório de colete'] },
    { id: 'rxt-x-300', marca: 'Sea-Doo', modelo: 'RXT-X 300 Turbo', ano: '2023', categoria: 'Performance', potencia: '300 hp', capacidade: '', cor: 'Preto / Vermelho', velMax: '', precoOriginal: 2100, precoDiaria: 1600, caucao: 0, localId: 'l1', status: 'disponivel', horasUso: 0, identificacao: 'JET 300', hue: 0,
      fotos: ['/img/rxt-x-300.webp'],
      descricao: 'Potência máxima: motor turbo de 300 hp para quem busca adrenalina e velocidade com o máximo de exclusividade.',
      caracteristicas: ['Modelo 2023', 'Motor turbo 300 hp', 'Diárias e pacotes sob medida', 'Combustível não incluso'],
      regras: ['Locação somente por diária (mínimo 1 diária)', 'Idade mínima de 18 anos', 'Uso obrigatório de colete'] },
  ],
  services: [
    { id: 's1', nome: 'Passeio acompanhado', descricao: 'Instrutor acompanha você durante o passeio.', preco: 0, icon: '🧭', ativo: false },
    { id: 's2', nome: 'Fotografia', descricao: 'Fotos profissionais da sua experiência.', preco: 0, icon: '📸', ativo: false },
    { id: 's3', nome: 'Filmagem com drone', descricao: 'Vídeo aéreo editado para você postar.', preco: 0, icon: '🎥', ativo: false },
  ],
  experiences: [
    { id: 'e1', nome: 'Locação por diária', descricao: 'O dia inteiro no comando do seu Jet Ski.', icon: '🌊', preco: 0, ativo: true },
    { id: 'e5', nome: 'Grupo / vários Jet Skis', descricao: 'Para amigos, família ou empresa. Fale com a gente para pacotes sob medida.', icon: '🚤', preco: 0, ativo: true },
    { id: 'e6', nome: 'Pacote sob medida', descricao: 'Várias diárias, datas especiais e eventos — montamos do seu jeito.', icon: '✨', preco: 0, ativo: true },
  ],
  coupons: [
    { id: 'cp10', codigo: 'LOCAJET10', tipo: 'percentual', valor: 10, validade: '', validadeDias: 30, limite: 0, usos: 0, minimo: 0, jets: [], ativo: true, imagem: '/img/cupom-10.webp' },
    { id: 'cp15', codigo: 'LOCAJET15', tipo: 'percentual', valor: 15, validade: '', validadeDias: 30, limite: 0, usos: 0, minimo: 0, jets: [], ativo: true, imagem: '/img/cupom-15.webp' },
  ],
  sales: [],
  bloqueios: [],
  clients: [], reservations: [], rentals: [], expenses: [], maintenance: [], reviews: [], notifications: [], contracts: [], abandoned: [],
  users: [{ id: 'u1', nome: 'Proprietário', email: 'admin@locajett.com', senha: 'admin123', papel: 'proprietario', ativo: true }],
})

// Tabelas que o site público pode ler
export const PUBLIC_TABLES = ['jetskis', 'services', 'experiences', 'locations', 'sales', 'bloqueios']
export const PUBLIC_SETTINGS = Object.keys(DEFAULT_SETTINGS).filter((k) => !['adminEmail'].includes(k))

export const buildAdminEmail = (r, client, jet, settings) => {
  const linhas = [
    ['Reserva', r.id], ['Status', r.statusLabel || r.status], ['Cliente', client.nome], ['WhatsApp / telefone', client.telefone], ['E-mail do cliente', client.email],
    ['Jet Ski', `${jet?.marca || ''} ${jet?.modelo || ''}`], ['Data de início', fmtDateS(r.data)], ['Quantidade de diárias', r.diarias], ['Data de término', fmtDateS(r.dataFim)],
    ['Valor total', brlS(r.total)], [`Entrada (${r.entradaPct ?? settings.entradaPct ?? 50}%)`, brlS(r.entrada)], ['Restante', brlS(r.restante)], ['Forma de pagamento', PAGAMENTO[r.formaPagamento] || r.formaPagamento],
    ['Cupom', r.cupom || '-'], ['Observações', r.obs || '-'],
  ]
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#0057FF">Nova reserva — Loca Jett Oficial</h2><table style="border-collapse:collapse;width:100%">${linhas.map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">${esc(k)}</td><td style="padding:8px;border-bottom:1px solid #eee"><b>${esc(v)}</b></td></tr>`).join('')}</table><p style="color:#777;font-size:12px">Reserva criada pelo site. Confirme a disponibilidade e o pagamento da entrada com o cliente.</p></div>`
  const text = linhas.map(([k, v]) => `${k}: ${v}`).join('\n')
  return { subject: `Nova reserva ${r.id} — ${client.nome} — ${fmtDateS(r.data)} (${r.diarias} diária${r.diarias > 1 ? 's' : ''})`, html, text }
}
