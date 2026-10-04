import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useDB, getDB, setDB, upsert, brl, fmtDate, today, STATUS, JET_STATUS, SALE_STATUS, ROLES, can, tier, waLink, whatsNumber, resetDB, clearExamples, notify, localISO, rangeConflict, rangeEnd, addDaysISO, diariasLabel, adminLogin, adminLogout, adminToken, adminPull, PAGAMENTO } from '../../store'
import { calcPrice } from '../../shared'
import { Logo, Badge, JetBadge, JetPhoto, Modal, Field, toast, Toaster } from '../../components/ui'
import { Bars, HBars, Crud } from './kit'
import { contractText } from '../contract'

const MODS = [['dashboard', 'Dashboard', '📊'], ['jet-skis', 'Jet Skis', '🌊'], ['venda', 'Venda de Jet Skis', '🏷️'], ['clientes', 'Clientes', '👥'], ['reservas', 'Reservas', '📅'], ['bloqueios', 'Bloquear datas', '⛔'], ['locacoes', 'Locações', '⏱️'], ['calendario', 'Calendário', '🗓️'], ['pagamentos', 'Pagamentos', '💳'], ['financeiro', 'Financeiro', '💰'], ['manutencao', 'Manutenção', '🔧'], ['contratos', 'Contratos', '📄'], ['promocoes', 'Cupons e promoções', '🎟️'], ['fidelidade', 'Fidelidade', '⭐'], ['indicacoes', 'Indicações', '🤝'], ['avaliacoes', 'Avaliações', '💬'], ['relatorios', 'Relatórios', '📈'], ['notificacoes', 'Notificações', '🔔'], ['usuarios', 'Usuários', '🔐'], ['configuracoes', 'Configurações', '⚙️']]
const jetName = (db, id) => { const j = db.jetskis.find((x) => x.id === id); return j ? `${j.marca} ${j.modelo}` : '-' }
const cliName = (db, id) => db.clients.find((x) => x.id === id)?.nome || '-'
const valid = (r) => r.status !== 'cancelada'
const paid = (r) => r.pagamento === 'pago'
const dayISO = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localISO(d) }

function AdminLogin() {
  const [f, setF] = useState({ email: '', senha: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (getDB().remote) {
      setLoading(true)
      try { const u = await adminLogin(f.email.trim(), f.senha); setDB((d) => ({ session: { ...d.session, adminId: u.id } })) } catch (ex) { setErr(ex.message) }
      setLoading(false); return
    }
    const u = getDB().users.find((x) => x.email === f.email.trim().toLowerCase() && x.senha === f.senha && x.ativo)
    if (!u) return setErr('Credenciais inválidas')
    setDB((d) => ({ session: { ...d.session, adminId: u.id } }))
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: 'radial-gradient(800px 400px at 50% 0%, rgba(0,120,255,.25), transparent), var(--background)' }}>
      <form className="card stack" style={{ width: 'min(420px,100%)' }} onSubmit={submit}>
        <Logo /><h2 style={{ margin: '8px 0 0' }}>Painel administrativo</h2>
        <Field label="E-mail" id="a-e"><input id="a-e" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" /></Field>
        <Field label="Senha" id="a-s"><input id="a-s" type="password" className="input" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="current-password" /></Field>
        {err && <span className="err-msg">{err}</span>}
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        <p className="small muted">{getDB().remote ? 'Acesso restrito à equipe Loca Jett.' : 'Modo local (sem servidor).'} <Link to="/" style={{ color: 'var(--primary)' }}>← Voltar ao site</Link></p>
      </form>
    </div>
  )
}

export function AdminLayout() {
  const db = useDB()
  const [open, setOpen] = useState(false)
  const user = db.users.find((u) => u.id === db.session.adminId)
  if (!user || (db.remote && !adminToken())) return <AdminLogin />
  const unread = db.notifications.filter((n) => !n.lida).length
  return (
    <div className="app">
      <div className="mobile-top"><Logo size={32} /><button className="burger" style={{ display: 'grid' }} onClick={() => setOpen(!open)} aria-label="Menu">☰</button></div>
      <aside className={'side ' + (open ? 'open' : '')} onClick={() => setOpen(false)}>
        <div style={{ padding: '4px 8px 18px' }}><Logo size={34} /></div>
        <nav aria-label="Admin">{MODS.filter(([k]) => can(user, k)).map(([k, l, i]) => <NavLink key={k} to={'/admin/' + k}><span>{i}</span>{l}{k === 'notificacoes' && unread > 0 && <span className="badge tone-warning" style={{ marginLeft: 'auto' }}>{unread}</span>}</NavLink>)}</nav>
        <div className="divider" />
        <div style={{ padding: '0 12px' }} className="small"><strong>{user.nome}</strong><div className="muted">{ROLES[user.papel].label}</div>
          <div className="flex" style={{ marginTop: 10 }}><Link to="/" className="btn btn-ghost btn-sm">Ver site</Link><button className="btn btn-ghost btn-sm" onClick={() => { adminLogout(); setDB((d) => ({ session: { ...d.session, adminId: null } })) }}>Sair</button></div></div>
      </aside>
      {open && <div className="overlay" style={{ zIndex: 65 }} onClick={() => setOpen(false)} />}
      <main className="main"><Guard user={user}><Outlet /></Guard></main>
      <Toaster />
    </div>
  )
}
function Guard({ user, children }) {
  const { mod = 'dashboard' } = useParams()
  return can(user, mod) ? children : <div className="card empty">🔐 Seu perfil ({ROLES[user.papel].label}) não tem acesso a este módulo.</div>
}
const Top = ({ title, children }) => <div className="topbar"><h2 style={{ margin: 0, fontSize: '1.6rem' }}>{title}</h2><div className="flex wrap">{children}</div></div>

export function AdminModule() {
  const { mod = 'dashboard' } = useParams()
  const C = { dashboard: Dashboard, 'jet-skis': JetSkisAdm, clientes: Clientes, reservas: Reservas, locacoes: Locacoes, calendario: Calendario, venda: VendaAdm, bloqueios: Bloqueios, pagamentos: Pagamentos, financeiro: Financeiro, manutencao: Manutencao, contratos: Contratos, promocoes: Promocoes, fidelidade: Fidelidade, indicacoes: Indicacoes, avaliacoes: Avaliacoes, relatorios: Relatorios, notificacoes: Notificacoes, usuarios: Usuarios, configuracoes: Configuracoes }[mod]
  return C ? <C /> : <div className="card empty">Módulo não encontrado.</div>
}

// ---------------- Dashboard ----------------
function Dashboard() {
  const db = useDB()
  const t = today()
  const R = db.reservations.filter(valid)
  const sum = (from) => R.filter((r) => r.data >= from && r.data <= t && paid(r)).reduce((a, r) => a + r.total, 0)
  const y = t.slice(0, 4), m = t.slice(0, 7)
  const k = [
    ['Faturamento hoje', brl(sum(t))], ['Faturamento semana', brl(sum(dayISO(-6)))], ['Faturamento mês', brl(sum(m + '-01'))], ['Faturamento ano', brl(sum(y + '-01-01'))],
    ['Retiradas hoje', R.filter((r) => r.data === t).length], ['Reservas pendentes', R.filter((r) => r.status.startsWith('aguardando') || r.status === 'pagamento_pendente').length], ['Reservas confirmadas', R.filter((r) => ['confirmada', 'pagamento_confirmado'].includes(r.status)).length], ['Ticket médio', brl(R.length ? R.reduce((a, r) => a + r.total, 0) / R.length : 0)],
    ['Jet Skis disponíveis', db.jetskis.filter((j) => j.status === 'disponivel').length], ['Jet Skis ocupados hoje', new Set(R.filter((r) => r.data <= t && (r.dataFim || r.data) >= t).map((r) => r.jetId)).size], ['Em manutenção', db.jetskis.filter((j) => j.status === 'manutencao').length], ['Clientes', db.clients.length + ` (+${db.clients.filter((c) => c.createdAt >= dayISO(-30)).length} em 30d)`],
  ]
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = dayISO(i - 6); return { l: d.slice(8) + '/' + d.slice(5, 7), v: R.filter((r) => r.data === d && paid(r)).reduce((a, r) => a + r.total, 0) } })
  const resDay = Array.from({ length: 14 }, (_, i) => { const d = dayISO(i - 7); return { l: d.slice(8), v: R.filter((r) => r.data === d).length } })
  const dows = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((l) => ({ l, v: 0 })); R.forEach((r) => { for (let i = 0; i < (r.diarias || 1); i++) dows[new Date(addDaysISO(r.data, i) + 'T12:00').getDay()].v++ })
  const topJets = db.jetskis.map((j) => ({ l: `${j.marca} ${j.modelo}`, v: R.filter((r) => r.jetId === j.id).length })).sort((a, b) => b.v - a.v)
  const upcoming = R.filter((r) => r.data >= t).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6)
  return (
    <>
      <Top title="Dashboard">{db.settings.demo && <span className="badge tone-warning">Dados de exemplo</span>}</Top>
      <div className="grid g4" style={{ gap: 14 }}>{k.map(([l, v]) => <div key={l} className="card kpi"><span>{l}</span><strong>{v}</strong></div>)}</div>
      <div className="grid g2" style={{ marginTop: 20 }}>
        <div className="card"><h4>Faturamento — últimos 7 dias</h4><Bars data={last7} fmt={brl} /></div>
        <div className="card"><h4>Reservas por data de início (−7 a +6)</h4><Bars data={resDay} /></div>
        <div className="card"><h4>Diárias por dia da semana</h4><HBars data={dows} /></div>
        <div className="card"><h4>Jet Skis mais reservados</h4><HBars data={topJets} /></div>
      </div>
      <div className="card" style={{ marginTop: 20 }}><h4>Próximas reservas</h4><ResTable rows={upcoming} /></div>
    </>
  )
}

function ResTable({ rows, onOpen }) {
  const db = useDB()
  return <div className="table-wrap"><table><thead><tr><th>Nº</th><th>Cliente</th><th>Jet Ski</th><th>Início</th><th>Diárias</th><th>Término</th><th>Total</th><th>Entrada</th><th>Pagamento</th><th>Status</th>{onOpen && <th></th>}</tr></thead>
    <tbody>{rows.length ? rows.map((r) => <tr key={r.id}><td><strong>{r.id}</strong></td><td>{cliName(db, r.clientId)}</td><td>{jetName(db, r.jetId)}</td><td>{fmtDate(r.data)}</td><td>{r.diarias}</td><td>{fmtDate(r.dataFim)}</td><td>{brl(r.total)}</td><td>{brl(r.entrada)}</td><td><span className={'badge tone-' + (paid(r) ? 'success' : r.pagamento === 'sinal' ? 'accent' : 'warning')}>{paid(r) ? 'Pago' : r.pagamento === 'sinal' ? 'Entrada paga' : 'Pendente'} · {PAGAMENTO[r.formaPagamento] || '-'}</span></td><td><Badge status={r.status} /></td>{onOpen && <td><button className="btn btn-ghost btn-sm" onClick={() => onOpen(r)}>Gerenciar</button></td>}</tr>) : <tr><td colSpan={10} className="empty">Nenhuma reserva.</td></tr>}</tbody></table></div>
}

// ---------------- Reservas ----------------
function Reservas() {
  const db = useDB()
  const [f, setF] = useState({ q: '', status: '', de: '', ate: '' })
  const [sel, setSel] = useState(null)
  const rows = db.reservations.filter((r) => (!f.status || r.status === f.status) && (!f.de || r.data >= f.de) && (!f.ate || r.data <= f.ate) && (!f.q || (r.id + cliName(db, r.clientId) + jetName(db, r.jetId)).toLowerCase().includes(f.q.toLowerCase()))).sort((a, b) => b.data.localeCompare(a.data))
  return (
    <>
      <Top title="Reservas" />
      <div className="card" style={{ marginBottom: 16 }}><div className="flex wrap">
        <input className="input" style={{ width: 220 }} placeholder="Nº, cliente ou Jet Ski" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Buscar" />
        <select className="input" style={{ width: 'auto' }} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">Todos os status</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <input type="date" className="input" style={{ width: 'auto' }} value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} aria-label="De" />
        <input type="date" className="input" style={{ width: 'auto' }} value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} aria-label="Até" />
      </div></div>
      <ResTable rows={rows} onOpen={setSel} />
      <ReservaModal r={sel} onClose={() => setSel(null)} />
      <Abandonadas />
    </>
  )
}
function ReservaModal({ r, onClose }) {
  const db = useDB()
  const [e, setE] = useState(null)
  if (!r) return null
  const cur = db.reservations.find((x) => x.id === r.id) || r
  const ed = e || cur
  const cli = db.clients.find((c) => c.id === cur.clientId) || {}
  const conflict = e ? rangeConflict(ed.jetId, ed.data, ed.diarias, cur.id) : null
  const setStatus = (status, extra = {}) => { upsert('reservations', { ...cur, status, ...extra }); notify('reserva', `${cur.id} → ${STATUS[status].label}`); toast('Status atualizado') }
  const saveEdit = () => {
    if (!ed.data || conflict) return toast('Período em conflito com outra reserva ou bloqueio')
    const jet = db.jetskis.find((x) => x.id === ed.jetId)
    const p = calcPrice({ jet, diarias: ed.diarias, services: db.services.filter((x) => (ed.servicos || []).includes(x.id)), settings: db.settings, coupon: cur.desconto ? { tipo: 'fixo', valor: cur.desconto } : null })
    upsert('reservations', { ...ed, dataFim: rangeEnd(ed.data, ed.diarias), subtotal: p.base, adicionais: p.adicionais, total: p.total, entrada: p.entrada, restante: p.restante }); setE(null); toast('Reserva alterada')
  }
  return (
    <Modal open onClose={() => { setE(null); onClose() }} title={`Reserva ${cur.id}`} width="820px">
      <div className="flex wrap" style={{ marginBottom: 12 }}><Badge status={cur.status} /><span className={'badge tone-' + (paid(cur) ? 'success' : cur.pagamento === 'sinal' ? 'accent' : 'warning')}>{paid(cur) ? 'Pago total' : cur.pagamento === 'sinal' ? 'Entrada paga' : 'Entrada pendente'}</span></div>
      <div className="grid g2">
        <div>{[['Cliente', cli.nome], ['E-mail', cli.email], ['WhatsApp', cli.telefone], ['CPF', cli.cpf || '-'], ['Nascimento', fmtDate(cli.nascimento) || '-'], ['Jet Ski', jetName(db, cur.jetId)], ['Início', fmtDate(cur.data)], ['Diárias', cur.diarias], ['Término', fmtDate(cur.dataFim)], ['Obs.', cur.obs || '-']].map(([k, v]) => <div className="line" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
        <div>{[['Jet Ski', brl(cur.subtotal)], ['Adicionais', brl(cur.adicionais)], ['Desconto', '-' + brl(cur.desconto)], ['Cupom', cur.cupom || '-'], ['Forma de pagamento', PAGAMENTO[cur.formaPagamento] || '-'], [`Entrada (${cur.entradaPct ?? 50}%)`, brl(cur.entrada)], ['Restante', brl(cur.restante)]].map(([k, v]) => <div className="line" key={k}><span>{k}</span><strong>{v}</strong></div>)}<div className="total"><span>Total</span><span>{brl(cur.total)}</span></div></div>
      </div>
      <div className="divider" />
      <div className="flex wrap">
        <button className="btn btn-primary btn-sm" onClick={() => setStatus('confirmada', { pagamento: cur.pagamento === 'pago' ? 'pago' : 'sinal' })}>✓ Entrada recebida — confirmar</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setStatus('pagamento_confirmado', { pagamento: 'pago' })}>💳 Pago total</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setStatus('em_andamento')}>▶ Retirado</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setStatus('concluida'); const c = getDB().clients.find((x) => x.id === cur.clientId); if (c) upsert('clients', { ...c, pontos: (c.pontos || 0) + Math.round(cur.total) }) }}>🏁 Devolvido / concluir</button>
        <button className="btn btn-danger btn-sm" onClick={() => confirm('Cancelar reserva? As datas serão liberadas.') && setStatus('cancelada')}>Cancelar</button>
        <a className="btn btn-wa btn-sm" target="_blank" rel="noreferrer" href={waLink(cli.whatsapp || cli.telefone, `Olá, ${cli.nome?.split(' ')[0]}! Aqui é a Loca Jett Oficial sobre sua reserva ${cur.id} (${fmtDate(cur.data)}, ${diariasLabel(cur.diarias)}). Entrada: ${brl(cur.entrada)} via ${PAGAMENTO[cur.formaPagamento] || 'Pix'}.${cur.formaPagamento === 'pix' && db.settings.pixChave ? ' Chave Pix: ' + db.settings.pixChave : ''}${cur.formaPagamento === 'cartao' && db.settings.cartaoLink ? ' Link: ' + db.settings.cartaoLink : ''}`)}>Abrir WhatsApp do cliente</a>
        <button className="btn btn-ghost btn-sm" onClick={() => { if (!getDB().contracts.some((c) => c.reservaId === cur.id)) upsert('contracts', { reservaId: cur.id, clientId: cur.clientId, criado: new Date().toISOString(), status: 'aguardando' }); toast('Contrato gerado') }}>📄 Gerar contrato</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setE({ ...cur })}>✏️ Alterar</button>
      </div>
      {e && <div className="card" style={{ marginTop: 16 }}><h4>Alterar Jet Ski / data / diárias</h4><div className="grid g2" style={{ gap: 12 }}>
        <Field label="Jet Ski" id="e-j"><select id="e-j" className="input" value={ed.jetId} onChange={(x) => setE({ ...ed, jetId: x.target.value })}>{db.jetskis.map((j) => <option key={j.id} value={j.id}>{j.marca} {j.modelo}</option>)}</select></Field>
        <Field label="Data de início" id="e-d"><input id="e-d" type="date" className="input" value={ed.data} onChange={(x) => setE({ ...ed, data: x.target.value })} /></Field>
        <Field label="Diárias" id="e-du"><input id="e-du" type="number" min="1" className="input" value={ed.diarias} onChange={(x) => setE({ ...ed, diarias: Math.max(1, +x.target.value || 1) })} /></Field>
        <Field label="Término" id="e-t"><div className="input">{ed.data ? fmtDate(rangeEnd(ed.data, ed.diarias)) : '—'}</div></Field>
      </div>{conflict && <p className="err-msg">Conflito com {conflict.tipo === 'bloqueio' ? 'um bloqueio de datas' : 'a reserva ' + conflict.item.id}.</p>}<div className="flex" style={{ marginTop: 12 }}><button className="btn btn-primary btn-sm" onClick={saveEdit}>Salvar alteração</button><button className="btn btn-ghost btn-sm" onClick={() => setE(null)}>Cancelar</button></div></div>}
    </Modal>
  )
}
function Abandonadas() {
  const db = useDB()
  if (!db.abandoned.length) return null
  return <div className="card" style={{ marginTop: 20 }}><h4>Reservas abandonadas (recuperação)</h4><div className="table-wrap"><table><thead><tr><th>Início</th><th>Jet Ski</th><th>Etapa</th><th>Contato</th><th>Total</th><th></th></tr></thead><tbody>
    {db.abandoned.map((a) => <tr key={a.startedAt}><td>{new Date(a.atualizado).toLocaleString('pt-BR')}</td><td>{jetName(db, a.jetId)}</td><td>{a.etapa}</td><td>{a.nome || '—'} {a.telefone}</td><td>{brl(a.total)}</td><td>{a.telefone ? <a className="btn btn-wa btn-sm" target="_blank" rel="noreferrer" href={waLink('55' + a.telefone.replace(/\D/g, ''), `Olá${a.nome ? ', ' + a.nome.split(' ')[0] : ''}! Vimos que você começou uma reserva de Jet Ski na Loca Jett. Use o cupom ${db.coupons.find((c) => c.ativo)?.codigo || '[CUPOM]'} e finalize: ${location.origin}/minha-reserva`)}>Enviar lembrete + cupom</a> : <span className="muted small">sem contato</span>}</td></tr>)}
  </tbody></table></div></div>
}

// ---------------- Jet Skis ----------------
function JetSkisAdm() {
  const db = useDB()
  const opts = (o) => Object.entries(o).map(([v, x]) => ({ v, l: x.label || x }))
  return (
    <>
      <Top title="Gestão de Jet Skis" />
      <Crud table="jetskis" title="Frota para locação" rows={db.jetskis} searchKeys={['marca', 'modelo', 'identificacao']}
        newItem={{ status: 'disponivel', hue: Math.floor(Math.random() * 360), caracteristicas: '', regras: 'Locação somente por diária (mínimo 1 diária)\nIdade mínima de 18 anos\nUso obrigatório de colete', fotos: [], localId: 'l1', marca: 'Sea-Doo' }}
        cols={[{ l: 'Foto', r: (j) => <div style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden' }}><JetPhoto jet={j} /></div> }, { l: 'Jet Ski', r: (j) => <strong>{j.marca} {j.modelo}</strong> }, { l: 'Ano', k: 'ano' }, { l: 'Preço normal', r: (j) => brl(j.precoOriginal) }, { l: 'Diária atual', r: (j) => <strong>{brl(j.precoDiaria)}</strong> }, { l: 'Status', r: (j) => <JetBadge status={j.status} /> }]}
        fields={[{ k: 'marca', l: 'Marca', req: true }, { k: 'modelo', l: 'Modelo', req: true }, { k: 'identificacao', l: 'Identificação interna' }, { k: 'ano', l: 'Ano' }, { k: 'categoria', l: 'Categoria' }, { k: 'potencia', l: 'Potência' }, { k: 'capacidade', l: 'Capacidade (pessoas)', type: 'number' }, { k: 'cor', l: 'Cor' },
          { k: 'precoOriginal', l: 'Preço normal da diária (riscado)', type: 'number' }, { k: 'precoDiaria', l: 'Preço atual da diária', type: 'number', req: true }, { k: 'caucao', l: 'Caução (opcional)', type: 'number' }, { k: 'horasUso', l: 'Horas de uso', type: 'number' },
          { k: 'localId', l: 'Local', type: 'select', options: db.locations.map((l) => ({ v: l.id, l: l.nome })) }, { k: 'status', l: 'Status', type: 'select', options: opts(JET_STATUS) }, { k: 'documentacao', l: 'Documentação (validade)', type: 'date' }, { k: 'hue', l: 'Cor da ilustração sem foto (0–360)', type: 'number' },
          { k: 'fotos', l: 'Fotos', type: 'images' }, { k: 'descricao', l: 'Descrição', type: 'textarea' }, { k: 'caracteristicas', l: 'Características', type: 'list' }, { k: 'regras', l: 'Regras', type: 'list' }]} />
      <p className="small muted" style={{ marginTop: 12 }}>A locação é sempre por diária. Para promoções, preencha o preço normal (aparece riscado) e o preço atual.</p>
    </>
  )
}

function VendaAdm() {
  const db = useDB()
  return (
    <>
      <Top title="Venda de Jet Skis"><Link to="/venda" className="btn btn-ghost btn-sm" target="_blank">Ver página pública</Link></Top>
      <Crud table="sales" title="Jet Skis à venda" rows={db.sales || []} searchKeys={['marca', 'modelo']} newItem={{ status: 'disponivel', fotos: [], marca: 'Sea-Doo' }}
        cols={[{ l: 'Foto', r: (x) => <div style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden' }}><JetPhoto jet={x} /></div> }, { l: 'Modelo', r: (x) => <strong>{x.marca} {x.modelo}</strong> }, { l: 'Ano', k: 'ano' }, { l: 'Horas', k: 'horasUso' }, { l: 'Estado', k: 'estado' }, { l: 'Preço', r: (x) => (x.preco ? brl(x.preco) : 'Consulte') }, { l: 'Status', r: (x) => <Badge status={x.status || 'disponivel'} map={SALE_STATUS} /> }]}
        fields={[{ k: 'marca', l: 'Marca' }, { k: 'modelo', l: 'Modelo', req: true }, { k: 'ano', l: 'Ano' }, { k: 'horasUso', l: 'Horas de uso', type: 'number' }, { k: 'estado', l: 'Estado de conservação', type: 'select', options: ['Novo', 'Seminovo', 'Excelente', 'Muito bom', 'Bom', 'Para reforma'].map((v) => ({ v, l: v })) }, { k: 'preco', l: 'Preço (vazio = sob consulta)', type: 'number' },
          { k: 'status', l: 'Status', type: 'select', options: [...Object.entries(SALE_STATUS).map(([v, x]) => ({ v, l: x.label })), { v: 'oculto', l: 'Oculto do site' }] }, { k: 'fotos', l: 'Fotos', type: 'images' }, { k: 'descricao', l: 'Descrição', type: 'textarea' }, { k: 'info', l: 'Informações adicionais', type: 'textarea' }]} />
      <p className="small muted" style={{ marginTop: 12 }}>O botão "Tenho interesse" leva o cliente ao WhatsApp da Loca Jett com o modelo já identificado.</p>
    </>
  )
}

function Bloqueios() {
  const db = useDB()
  const jets = [{ v: '*', l: 'Todos os Jet Skis' }, ...db.jetskis.map((j) => ({ v: j.id, l: `${j.marca} ${j.modelo}` }))]
  return (
    <>
      <Top title="Bloquear datas" />
      <Crud table="bloqueios" title="Datas bloqueadas para reserva" rows={[...(db.bloqueios || [])].sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''))} newItem={{ jetId: '*', inicio: today(), fim: today() }}
        cols={[{ l: 'Jet Ski', r: (b) => jets.find((j) => j.v === b.jetId)?.l || '-' }, { l: 'De', r: (b) => fmtDate(b.inicio) }, { l: 'Até', r: (b) => fmtDate(b.fim || b.inicio) }, { l: 'Motivo', k: 'motivo' }]}
        fields={[{ k: 'jetId', l: 'Jet Ski', type: 'select', req: true, options: jets }, { k: 'inicio', l: 'De', type: 'date', req: true }, { k: 'fim', l: 'Até (inclusive)', type: 'date', req: true }, { k: 'motivo', l: 'Motivo (manutenção, uso próprio, evento...)' }]} />
      <p className="small muted" style={{ marginTop: 12 }}>Datas bloqueadas aparecem como indisponíveis no calendário do site e não podem ser reservadas.</p>
    </>
  )
}

// ---------------- Clientes ----------------
function Clientes() {
  const db = useDB()
  const [view, setView] = useState(null)
  const [f, setF] = useState({ cidade: '', status: '' })
  const stats = (c) => { const rs = db.reservations.filter((r) => r.clientId === c.id && valid(r)); return { n: rs.length, gasto: rs.filter(paid).reduce((a, r) => a + r.total, 0), ultima: rs.map((r) => r.data).sort().pop() } }
  const rows = db.clients.filter((c) => (!f.status || c.status === f.status) && (!f.cidade || (c.cidade || '').toLowerCase().includes(f.cidade.toLowerCase())))
  return (
    <>
      <Top title="Gestão de Clientes"><input className="input" style={{ width: 160 }} placeholder="Cidade" value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} aria-label="Filtrar cidade" /><select className="input" style={{ width: 'auto' }} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">Todos</option><option value="ativo">Ativos</option><option value="bloqueado">Bloqueados</option></select></Top>
      <Crud table="clients" title="Clientes" rows={rows} searchKeys={['nome', 'telefone', 'email']} newItem={{ status: 'ativo', estado: 'GO', pontos: 0, createdAt: today(), refCode: 'AMIGO-' + Math.random().toString(36).slice(2, 7).toUpperCase() }}
        cols={[{ l: 'Nome', r: (c) => <strong>{c.nome}</strong> }, { l: 'Telefone', k: 'telefone' }, { l: 'E-mail', k: 'email' }, { l: 'Cidade', k: 'cidade' }, { l: 'Reservas', r: (c) => stats(c).n }, { l: 'Gasto', r: (c) => brl(stats(c).gasto) }, { l: 'Última', r: (c) => fmtDate(stats(c).ultima) || '—' }, { l: 'Status', r: (c) => <span className={'badge tone-' + (c.status === 'bloqueado' ? 'danger' : 'success')}>{c.status}</span> }, { l: 'Cadastro', r: (c) => fmtDate(c.createdAt?.slice(0, 10)) }]}
        fields={[{ k: 'nome', l: 'Nome', req: true }, { k: 'email', l: 'E-mail', req: true }, { k: 'telefone', l: 'Telefone' }, { k: 'whatsapp', l: 'WhatsApp (com DDI)' }, { k: 'cpf', l: 'CPF' }, { k: 'cidade', l: 'Cidade' }, { k: 'estado', l: 'Estado' }, { k: 'status', l: 'Status', type: 'select', options: [{ v: 'ativo', l: 'Ativo' }, { v: 'bloqueado', l: 'Bloqueado' }] }]}
        actions={(c) => <><button className="btn btn-ghost btn-sm" onClick={() => setView(c)}>Histórico</button><button className="btn btn-ghost btn-sm" onClick={() => upsert('clients', { ...c, status: c.status === 'bloqueado' ? 'ativo' : 'bloqueado' })}>{c.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}</button></>} />
      <Modal open={!!view} onClose={() => setView(null)} title={view?.nome} width="860px">{view && <><p className="small">{view.email} · {view.telefone} · Nível {tier(view.pontos || 0)} ({view.pontos || 0} pts)</p><ResTable rows={db.reservations.filter((r) => r.clientId === view.id)} /></>}</Modal>
    </>
  )
}

// ---------------- Locações ----------------
function Locacoes() {
  const db = useDB()
  return (
    <>
      <Top title="Gestão de Locações" />
      <Crud table="rentals" title="Registros de saída e retorno" rows={db.rentals} newItem={{ caucao: 'retida', danos: 'Nenhum' }}
        cols={[{ l: 'Reserva', k: 'reservaId' }, { l: 'Cliente', r: (r) => cliName(db, r.clientId) }, { l: 'Jet Ski', r: (r) => jetName(db, r.jetId) }, { l: 'Saída', k: 'saida' }, { l: 'Retorno', k: 'retorno' }, { l: 'Horas', k: 'horas' }, { l: 'Caução', k: 'caucao' }, { l: 'Danos', k: 'danos' }]}
        fields={[{ k: 'reservaId', l: 'Reserva', type: 'select', options: db.reservations.map((r) => ({ v: r.id, l: `${r.id} — ${cliName(db, r.clientId)}` })) }, { k: 'clientId', l: 'Cliente', type: 'select', options: db.clients.map((c) => ({ v: c.id, l: c.nome })) }, { k: 'jetId', l: 'Jet Ski', type: 'select', options: db.jetskis.map((j) => ({ v: j.id, l: `${j.marca} ${j.modelo}` })) }, { k: 'saida', l: 'Saída', type: 'time' }, { k: 'retorno', l: 'Retorno', type: 'time' }, { k: 'horas', l: 'Horas utilizadas', type: 'number' }, { k: 'valor', l: 'Valor', type: 'number' }, { k: 'caucao', l: 'Caução', type: 'select', options: [{ v: 'retida', l: 'Retida' }, { v: 'devolvida', l: 'Devolvida' }, { v: 'parcial', l: 'Devolvida parcialmente' }] }, { k: 'danos', l: 'Danos' }, { k: 'obs', l: 'Observações / ocorrências', type: 'textarea' }]} />
    </>
  )
}

// ---------------- Calendário ----------------
function Calendario() {
  const db = useDB()
  const [ym, setYm] = useState(today().slice(0, 7))
  const [y, m] = ym.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  const dates = Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)
  const move = (k) => { const d = new Date(y, m - 1 + k, 1); setYm(localISO(d).slice(0, 7)) }
  const cell = (j, d) => {
    if (j.status === 'manutencao') return { bg: 'rgba(255,92,122,.18)', t: '🔧', tip: 'Manutenção' }
    const r = db.reservations.find((x) => x.jetId === j.id && valid(x) && x.data <= d && (x.dataFim || x.data) >= d)
    if (r) return { bg: r.status === 'em_andamento' ? 'rgba(0,180,255,.3)' : ['confirmada', 'pagamento_confirmado'].includes(r.status) ? 'rgba(34,211,160,.25)' : 'rgba(255,181,71,.25)', t: r.data === d ? r.id.slice(3, 6) : '•', tip: `${r.id} — ${cliName(db, r.clientId)} — ${STATUS[r.status]?.label}`, r }
    const b = (db.bloqueios || []).find((x) => (x.jetId === '*' || x.jetId === j.id) && x.inicio <= d && (x.fim || x.inicio) >= d)
    if (b) return { bg: 'rgba(120,144,170,.25)', t: '⛔', tip: 'Bloqueado: ' + (b.motivo || '') }
    return { bg: 'transparent', t: '', tip: 'Livre' }
  }
  const [sel, setSel] = useState(null)
  return (
    <>
      <Top title="Calendário de ocupação"><button className="btn btn-ghost btn-sm" onClick={() => move(-1)} aria-label="Mês anterior">‹</button><strong style={{ textTransform: 'capitalize', minWidth: 140, textAlign: 'center' }}>{new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong><button className="btn btn-ghost btn-sm" onClick={() => move(1)} aria-label="Próximo mês">›</button></Top>
      <div className="table-wrap"><table style={{ fontSize: '.72rem' }}><thead><tr><th style={{ position: 'sticky', left: 0, background: 'var(--background-secondary)' }}>Jet Ski</th>{dates.map((d) => <th key={d} style={{ padding: '8px 4px', textAlign: 'center', color: d === today() ? 'var(--primary)' : undefined }}>{d.slice(8)}<br />{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][new Date(d + 'T12:00').getDay()]}</th>)}</tr></thead><tbody>
        {db.jetskis.map((j) => <tr key={j.id}><td style={{ position: 'sticky', left: 0, background: 'var(--background-secondary)' }}><strong>{j.modelo}</strong></td>{dates.map((d) => { const c = cell(j, d); return <td key={d} title={`${fmtDate(d)} — ${c.tip}`} onClick={() => c.r && setSel(c.r)} style={{ background: c.bg, padding: '8px 2px', textAlign: 'center', cursor: c.r ? 'pointer' : 'default', borderLeft: '1px solid var(--border)' }}>{c.t}</td> })}</tr>)}
      </tbody></table></div>
      <div className="cal-legend"><span><i style={{ background: 'var(--warning)' }} />Aguardando entrada</span><span><i style={{ background: 'var(--success)' }} />Confirmada</span><span><i style={{ background: 'var(--primary)' }} />Em uso</span><span><i style={{ background: 'var(--danger)' }} />Manutenção</span><span><i style={{ background: 'var(--text-muted)' }} />Bloqueado (⛔)</span></div>
      <p className="small muted">Clique numa reserva para gerenciar. Para bloquear datas use o menu <Link to="/admin/bloqueios" style={{ color: 'var(--primary)' }}>Bloquear datas</Link>.</p>
      <ReservaModal r={sel} onClose={() => setSel(null)} />
    </>
  )
}

// ---------------- Pagamentos & Financeiro ----------------
function Pagamentos() {
  const db = useDB()
  const rows = db.reservations.filter(valid).sort((a, b) => b.data.localeCompare(a.data))
  const setPag = (r, pagamento) => { upsert('reservations', { ...r, pagamento, status: pagamento === 'pago' ? 'pagamento_confirmado' : r.status }); notify('pagamento', `Pagamento de ${r.id}: ${pagamento}`); toast('Pagamento atualizado') }
  return (
    <>
      <Top title="Pagamentos" />
      <div className="grid g4" style={{ gap: 14, marginBottom: 16 }}>{[['Recebido', rows.filter(paid).reduce((a, r) => a + r.total, 0)], ['Pendente', rows.filter((r) => !paid(r)).reduce((a, r) => a + r.total, 0)], ['Descontos', rows.reduce((a, r) => a + r.desconto, 0)], ['Cauções (abertas)', rows.filter((r) => !['concluida'].includes(r.status)).reduce((a, r) => a + r.caucao, 0)]].map(([l, v]) => <div key={l} className="card kpi"><span>{l}</span><strong>{brl(v)}</strong></div>)}</div>
      <div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Cliente</th><th>Valor</th><th>Desconto</th><th>Taxa</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id}><td>{r.id}</td><td>{cliName(db, r.clientId)}</td><td>{brl(r.subtotal + r.adicionais)}</td><td>{brl(r.desconto)}</td><td>{brl(r.taxas)}</td><td><strong>{brl(r.total)}</strong></td><td><span className={'badge tone-' + (paid(r) ? 'success' : 'warning')}>{paid(r) ? 'Pago' : r.pagamento === 'sinal' ? 'Sinal' : 'Pendente'}</span></td><td><div className="flex"><button className="btn btn-ghost btn-sm" onClick={() => setPag(r, 'sinal')}>Sinal</button><button className="btn btn-primary btn-sm" onClick={() => setPag(r, 'pago')}>Pago</button></div></td></tr>)}
      </tbody></table></div>
      <p className="small muted" style={{ marginTop: 12 }}>Integração com PIX / cartão / pagamento online preparada — ver SPEC.mdx › Pagamentos.</p>
    </>
  )
}

function Financeiro() {
  const db = useDB()
  const [p, setP] = useState('mes')
  const [range, setRange] = useState({ de: '', ate: '' })
  const t = today()
  const from = { hoje: t, semana: dayISO(-6), mes: t.slice(0, 7) + '-01', ano: t.slice(0, 4) + '-01-01', custom: range.de || '0000' }[p]
  const to = p === 'custom' ? range.ate || '9999' : t
  const R = db.reservations.filter((r) => valid(r) && r.data >= from && r.data <= to)
  const E = db.expenses.filter((e) => e.data >= from && e.data <= to)
  const M = db.maintenance.filter((m) => m.data >= from && m.data <= to)
  const receita = R.filter(paid).reduce((a, r) => a + r.total, 0)
  const despesas = E.reduce((a, e) => a + e.valor, 0) + M.reduce((a, m) => a + (m.custo || 0), 0)
  const rent = db.jetskis.map((j) => {
    const rs = db.reservations.filter((r) => r.jetId === j.id && valid(r))
    const fat = rs.filter(paid).reduce((a, r) => a + r.total, 0)
    const desp = db.expenses.filter((e) => e.jetId === j.id).reduce((a, e) => a + e.valor, 0)
    const man = db.maintenance.filter((m) => m.jetId === j.id).reduce((a, m) => a + (m.custo || 0), 0)
    const horas = rs.reduce((a, r) => a + (r.diarias || 1), 0)
    return { j, n: rs.length, horas, fat, desp, man, lucro: fat - desp - man, ocup: Math.round((rs.filter((r) => r.data >= dayISO(-30) && r.data <= today()).reduce((a, r) => a + (r.diarias || 1), 0) / 30) * 100) }
  }).sort((a, b) => b.lucro - a.lucro)
  return (
    <>
      <Top title="Financeiro">{[['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês'], ['ano', 'Ano'], ['custom', 'Período']].map(([k, l]) => <button key={k} className={'chip ' + (p === k ? 'on' : '')} onClick={() => setP(k)}>{l}</button>)}{p === 'custom' && <><input type="date" className="input" style={{ width: 'auto' }} value={range.de} onChange={(e) => setRange({ ...range, de: e.target.value })} aria-label="De" /><input type="date" className="input" style={{ width: 'auto' }} value={range.ate} onChange={(e) => setRange({ ...range, ate: e.target.value })} aria-label="Até" /></>}</Top>
      <div className="grid g4" style={{ gap: 14 }}>{[['Receitas', receita], ['Despesas', despesas], ['Lucro estimado', receita - despesas], ['A receber', R.filter((r) => !paid(r)).reduce((a, r) => a + r.total, 0)], ['Faturamento bruto', R.reduce((a, r) => a + r.total, 0)], ['Cauções', R.reduce((a, r) => a + r.caucao, 0)], ['Descontos', R.reduce((a, r) => a + r.desconto, 0)], ['Taxas', R.reduce((a, r) => a + r.taxas, 0)]].map(([l, v]) => <div key={l} className="card kpi"><span>{l}</span><strong>{brl(v)}</strong></div>)}</div>
      <div className="card" style={{ marginTop: 20 }}><h4>Rentabilidade por Jet Ski — ranking</h4><div className="table-wrap"><table><thead><tr><th>#</th><th>Jet Ski</th><th>Reservas</th><th>Diárias</th><th>Faturamento</th><th>Despesas</th><th>Manutenção</th><th>Lucro est.</th><th>Ocupação (30d)</th></tr></thead><tbody>{rent.map((x, i) => <tr key={x.j.id}><td>{i + 1}º</td><td>{x.j.marca} {x.j.modelo}</td><td>{x.n}</td><td>{x.horas}</td><td>{brl(x.fat)}</td><td>{brl(x.desp)}</td><td>{brl(x.man)}</td><td><strong>{brl(x.lucro)}</strong></td><td>{x.ocup}%</td></tr>)}</tbody></table></div></div>
      <div style={{ marginTop: 20 }}><Crud table="expenses" title="Despesas" rows={db.expenses} newItem={{ data: today() }} cols={[{ l: 'Data', r: (e) => fmtDate(e.data) }, { l: 'Descrição', k: 'descricao' }, { l: 'Jet Ski', r: (e) => jetName(db, e.jetId) }, { l: 'Valor', r: (e) => brl(e.valor) }]} fields={[{ k: 'descricao', l: 'Descrição', req: true }, { k: 'valor', l: 'Valor', type: 'number', req: true }, { k: 'data', l: 'Data', type: 'date' }, { k: 'jetId', l: 'Jet Ski (opcional)', type: 'select', options: db.jetskis.map((j) => ({ v: j.id, l: `${j.marca} ${j.modelo}` })) }]} /></div>
    </>
  )
}

// ---------------- Manutenção ----------------
function Manutencao() {
  const db = useDB()
  const t = today()
  const alerts = []
  db.maintenance.forEach((m) => { if (m.proxima && m.proxima < t) alerts.push(['danger', `Manutenção vencida: ${jetName(db, m.jetId)} (${fmtDate(m.proxima)})`]); else if (m.proxima && m.proxima <= dayISO(15)) alerts.push(['warning', `Revisão próxima: ${jetName(db, m.jetId)} em ${fmtDate(m.proxima)}`]) })
  db.jetskis.forEach((j) => { if (j.horasUso && j.horasUso % 100 >= 90) alerts.push(['warning', `${j.identificacao} perto de ${Math.ceil(j.horasUso / 100) * 100}h de uso`]); if (j.documentacao && j.documentacao <= dayISO(30)) alerts.push(['danger', `Documentação de ${j.identificacao} vence em ${fmtDate(j.documentacao)}`]) })
  return (
    <>
      <Top title="Manutenção" />
      {alerts.length > 0 && <div className="stack" style={{ marginBottom: 16 }}>{alerts.map(([t2, a], i) => <div key={i} className={'card tone-' + t2} style={{ padding: 12 }}>⚠️ {a}</div>)}</div>}
      <Crud table="maintenance" title="Registros de manutenção" rows={db.maintenance} newItem={{ data: today(), status: 'agendada' }}
        cols={[{ l: 'Jet Ski', r: (m) => jetName(db, m.jetId) }, { l: 'Data', r: (m) => fmtDate(m.data) }, { l: 'Horas', k: 'horasUso' }, { l: 'Tipo', k: 'tipo' }, { l: 'Custo', r: (m) => brl(m.custo) }, { l: 'Responsável', k: 'responsavel' }, { l: 'Próxima', r: (m) => fmtDate(m.proxima) }, { l: 'Status', k: 'status' }]}
        fields={[{ k: 'jetId', l: 'Jet Ski', type: 'select', req: true, options: db.jetskis.map((j) => ({ v: j.id, l: `${j.marca} ${j.modelo}` })) }, { k: 'data', l: 'Data', type: 'date' }, { k: 'horasUso', l: 'Horas de uso', type: 'number' }, { k: 'tipo', l: 'Manutenção', req: true }, { k: 'custo', l: 'Custo', type: 'number' }, { k: 'responsavel', l: 'Responsável' }, { k: 'proxima', l: 'Próxima revisão', type: 'date' }, { k: 'status', l: 'Status', type: 'select', options: [{ v: 'agendada', l: 'Agendada' }, { v: 'em_andamento', l: 'Em andamento' }, { v: 'concluida', l: 'Concluída' }] }, { k: 'descricao', l: 'Descrição', type: 'textarea' }]} />
    </>
  )
}

// ---------------- Contratos ----------------
function Contratos() {
  const db = useDB()
  const [v, setV] = useState(null)
  return (
    <>
      <Top title="Contratos digitais" />
      <div className="card"><p className="small">Gere o contrato a partir da reserva (Reservas › Gerenciar › Gerar contrato). O cliente assina na área do cliente.</p>
        <div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Cliente</th><th>Gerado</th><th>Status</th><th></th></tr></thead><tbody>
          {db.contracts.length ? db.contracts.map((c) => <tr key={c.id}><td>{c.reservaId}</td><td>{cliName(db, c.clientId)}</td><td>{new Date(c.criado).toLocaleString('pt-BR')}</td><td><span className={'badge tone-' + (c.status === 'assinado' ? 'success' : 'warning')}>{c.status === 'assinado' ? 'Assinado' : 'Aguardando assinatura'}</span></td><td><button className="btn btn-ghost btn-sm" onClick={() => setV(c)}>Visualizar / PDF</button></td></tr>) : <tr><td colSpan={5} className="empty">Nenhum contrato gerado.</td></tr>}
        </tbody></table></div></div>
      <Modal open={!!v} onClose={() => setV(null)} title={'Contrato ' + v?.reservaId} width="820px">{v && <><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--text-secondary)' }}>{contractText(db, v.reservaId)}</pre><button className="btn btn-primary" onClick={() => { const w = window.open(''); w.document.write(`<pre style="font-family:sans-serif;white-space:pre-wrap;padding:32px">${contractText(db, v.reservaId).replace(/</g, '&lt;')}</pre>`); w.print() }}>Gerar PDF</button></>}</Modal>
    </>
  )
}

// ---------------- Promoções / Fidelidade / Indicações ----------------
function Promocoes() {
  const db = useDB()
  return (
    <>
      <Top title="Cupons e promoções" />
      <Crud table="coupons" title="Cupons" rows={db.coupons} newItem={{ tipo: 'percentual', ativo: true, usos: 0, jets: [] }}
        cols={[{ l: 'Código', r: (c) => <strong>{c.codigo}</strong> }, { l: 'Desconto', r: (c) => (c.tipo === 'percentual' ? c.valor + '%' : brl(c.valor)) }, { l: 'Validade', r: (c) => fmtDate(c.validade) }, { l: 'Usos', r: (c) => `${c.usos}/${c.limite || '∞'}` }, { l: 'Mínimo', r: (c) => brl(c.minimo) }, { l: 'Jet Skis', r: (c) => (c.jets?.length ? c.jets.join(', ') : c.jetsTxt || 'Todos') }, { l: 'Ativo', r: (c) => (c.ativo ? '✅' : '—') }]}
        fields={[{ k: 'codigo', l: 'Código', req: true }, { k: 'tipo', l: 'Tipo', type: 'select', options: [{ v: 'percentual', l: 'Percentual (%)' }, { v: 'fixo', l: 'Valor fixo (R$)' }] }, { k: 'valor', l: 'Desconto', type: 'number', req: true }, { k: 'validade', l: 'Validade', type: 'date' }, { k: 'limite', l: 'Limite de usos', type: 'number' }, { k: 'minimo', l: 'Valor mínimo', type: 'number' }, { k: 'jetsTxt', l: 'IDs de Jet Skis participantes (vazio = todos, ex: gti-170,rxt-x-300)' }, { k: 'validadeDias', l: 'Validade informada (dias após recebimento)', type: 'number' }, { k: 'imagem', l: 'Imagem do cupom (link) — aparece na página inicial' }, { k: 'ativo', l: 'Ativo', type: 'checkbox' }]} />
      <p className="small muted" style={{ marginTop: 8 }}>Dica: campanhas e preços especiais podem ser feitos ajustando preços do Jet Ski e criando cupons por período.</p>
    </>
  )
}
function Fidelidade() {
  const db = useDB()
  const tiers = ['Bronze', 'Prata', 'Ouro', 'VIP']
  return (
    <>
      <Top title="Programa de fidelidade" />
      <div className="grid g4" style={{ gap: 14 }}>{[['Bronze', '0+', 'Acúmulo de pontos'], ['Prata', '400+', '5% em adicionais'], ['Ouro', '1000+', '10% de desconto + prioridade'], ['VIP', '2000+', 'Ofertas exclusivas e bônus']].map(([t, p, b]) => <div key={t} className="card kpi"><span>{t} · {p} pts</span><strong>{db.clients.filter((c) => tier(c.pontos || 0) === t).length}</strong><small className="muted">{b} — {'[DEFINIR BENEFÍCIO]'}</small></div>)}</div>
      <div className="card" style={{ marginTop: 20 }}><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Pontos</th><th>Nível</th><th>Ajustar</th></tr></thead><tbody>{[...db.clients].sort((a, b) => (b.pontos || 0) - (a.pontos || 0)).map((c) => <tr key={c.id}><td>{c.nome}</td><td>{c.pontos || 0}</td><td><span className="badge tone-accent">{tier(c.pontos || 0)}</span></td><td><div className="flex"><button className="btn btn-ghost btn-sm" onClick={() => upsert('clients', { ...c, pontos: (c.pontos || 0) + 100 })}>+100</button><button className="btn btn-ghost btn-sm" onClick={() => upsert('clients', { ...c, pontos: Math.max(0, (c.pontos || 0) - 100) })}>−100</button></div></td></tr>)}</tbody></table></div></div>
      <p className="small muted">{tiers.join(' → ')} · 1 ponto por R$ 1 em reservas concluídas.</p>
    </>
  )
}
function Indicacoes() {
  const db = useDB()
  const rows = db.clients.filter((c) => c.indicadoPor)
  return (
    <>
      <Top title="Indicações de amigos" />
      <div className="card"><div className="table-wrap"><table><thead><tr><th>Quem indicou</th><th>Código</th><th>Novo cliente</th><th>Reservou?</th><th>Benefício</th></tr></thead><tbody>
        {rows.length ? rows.map((c) => { const by = db.clients.find((x) => x.id === c.indicadoPor); const res = db.reservations.some((r) => r.clientId === c.id && valid(r)); return <tr key={c.id}><td>{by?.nome}</td><td>{by?.refCode}</td><td>{c.nome}</td><td>{res ? '✅ Sim' : '—'}</td><td>{res ? <button className="btn btn-ghost btn-sm" onClick={() => { upsert('clients', { ...by, pontos: (by.pontos || 0) + 100 }); toast('+100 pontos para ' + by.nome) }}>Dar +100 pts</button> : 'Aguardando reserva'}</td></tr> }) : <tr><td colSpan={5} className="empty">Nenhuma indicação ainda.</td></tr>}
      </tbody></table></div></div>
    </>
  )
}

// ---------------- Avaliações ----------------
function Avaliacoes() {
  const db = useDB()
  const avg = (k) => (db.reviews.length ? (db.reviews.reduce((a, r) => a + (r[k] || 0), 0) / db.reviews.length).toFixed(1) : '—')
  return (
    <>
      <Top title="Avaliações" />
      <div className="grid g4" style={{ gap: 14, marginBottom: 16 }}>{[['Geral', 'geral'], ['Atendimento', 'atendimento'], ['Jet Ski', 'jetski'], ['Experiência', 'experiencia']].map(([l, k]) => <div key={k} className="card kpi"><span>{l}</span><strong>⭐ {avg(k)}</strong></div>)}</div>
      <div className="stack">{db.reviews.map((r) => <div key={r.id} className="card"><div className="flex between wrap"><strong>{cliName(db, r.clientId)} · {r.reservaId}</strong><span>{'⭐'.repeat(r.geral)}</span></div><p style={{ margin: '8px 0' }}>{r.comentario}</p>
        <div className="flex wrap"><input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Responder..." defaultValue={r.resposta} onBlur={(e) => upsert('reviews', { ...r, resposta: e.target.value })} aria-label="Resposta" /><button className="btn btn-ghost btn-sm" onClick={() => upsert('reviews', { ...r, visivel: !r.visivel })}>{r.visivel ? 'Ocultar' : 'Exibir'}</button></div></div>)}{!db.reviews.length && <div className="card empty">Sem avaliações.</div>}</div>
    </>
  )
}

// ---------------- Relatórios ----------------
function Relatorios() {
  const db = useDB()
  const R = db.reservations
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); const k = localISO(d).slice(0, 7); return { l: d.toLocaleDateString('pt-BR', { month: 'short' }), v: R.filter((r) => valid(r) && paid(r) && r.data.startsWith(k)).reduce((a, r) => a + r.total, 0) } })
  const recorrentes = db.clients.filter((c) => R.filter((r) => r.clientId === c.id && valid(r)).length > 1).length
  const ativos = db.clients.filter((c) => R.some((r) => r.clientId === c.id && r.data >= dayISO(-90))).length
  const cancel = R.length ? Math.round((R.filter((r) => r.status === 'cancelada').length / R.length) * 100) : 0
  const exportCSV = () => {
    const rows = [['numero', 'cliente', 'jetski', 'inicio', 'diarias', 'termino', 'total', 'entrada', 'forma_pagamento', 'pagamento', 'status'], ...R.map((r) => [r.id, cliName(db, r.clientId), jetName(db, r.jetId), r.data, r.diarias, r.dataFim, r.total, r.entrada, r.formaPagamento, r.pagamento, r.status])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((x) => x.map((v) => `"${v}"`).join(';')).join('\n')], { type: 'text/csv' })); a.download = 'reservas-locajett.csv'; a.click()
  }
  return (
    <>
      <Top title="Relatórios"><button className="btn btn-primary btn-sm" onClick={exportCSV}>⬇ Exportar reservas (CSV)</button></Top>
      <div className="grid g4" style={{ gap: 14 }}>{[['Clientes novos (30d)', db.clients.filter((c) => c.createdAt >= dayISO(-30)).length], ['Recorrentes', recorrentes], ['Ativos (90d)', ativos], ['Inativos', db.clients.length - ativos], ['Taxa de cancelamento', cancel + '%'], ['Ticket médio', brl(R.filter(valid).length ? R.filter(valid).reduce((a, r) => a + r.total, 0) / R.filter(valid).length : 0)], ['Reservas totais', R.length], ['Avaliação média', db.reviews.length ? (db.reviews.reduce((a, r) => a + r.geral, 0) / db.reviews.length).toFixed(1) : '—']].map(([l, v]) => <div key={l} className="card kpi"><span>{l}</span><strong>{v}</strong></div>)}</div>
      <div className="grid g2" style={{ marginTop: 20 }}>
        <div className="card"><h4>Faturamento — últimos 6 meses</h4><Bars data={months} fmt={brl} /></div>
        <div className="card"><h4>Receita por Jet Ski</h4><HBars fmt={brl} data={db.jetskis.map((j) => ({ l: j.identificacao + ' ' + j.modelo, v: R.filter((r) => r.jetId === j.id && valid(r) && paid(r)).reduce((a, r) => a + r.total, 0) }))} /></div>
      </div>
    </>
  )
}

// ---------------- Notificações ----------------
function Notificacoes() {
  const db = useDB()
  const icon = { reserva: '📅', pagamento: '💳', manutencao: '🔧', cliente: '👤', avaliacao: '⭐', documento: '📄', cancelamento: '❌' }
  return (
    <>
      <Top title="Notificações"><button className="btn btn-ghost btn-sm" onClick={() => setDB((d) => ({ notifications: d.notifications.map((n) => ({ ...n, lida: true })) }))}>Marcar todas como lidas</button></Top>
      <div className="stack">{db.notifications.length ? db.notifications.map((n) => <div key={n.id} className="card flex between" style={{ padding: 14, opacity: n.lida ? 0.6 : 1 }}><span>{icon[n.tipo] || '🔔'} {n.texto}</span><small className="muted">{new Date(n.data).toLocaleString('pt-BR')}</small></div>) : <div className="card empty">Sem notificações.</div>}</div>
    </>
  )
}

// ---------------- Usuários ----------------
function Usuarios() {
  const db = useDB()
  return (
    <>
      <Top title="Usuários administrativos" />
      <Crud table="users" title="Equipe" rows={db.users} newItem={{ papel: 'atendente', ativo: true }}
        cols={[{ l: 'Nome', k: 'nome' }, { l: 'E-mail', k: 'email' }, { l: 'Perfil', r: (u) => <span className="badge tone-accent">{ROLES[u.papel]?.label}</span> }, { l: 'Acesso', r: (u) => (ROLES[u.papel]?.modules === '*' ? 'Total' : ROLES[u.papel]?.modules.length + ' módulos') }, { l: 'Ativo', r: (u) => (u.ativo ? '✅' : '—') }]}
        fields={[{ k: 'nome', l: 'Nome', req: true }, { k: 'email', l: 'E-mail', req: true }, { k: 'senha', l: 'Senha', type: 'password', req: true }, { k: 'papel', l: 'Perfil', type: 'select', options: Object.entries(ROLES).map(([v, x]) => ({ v, l: x.label })) }, { k: 'ativo', l: 'Ativo', type: 'checkbox' }]} />
      <div className="card" style={{ marginTop: 16 }}><h4>Permissões por perfil</h4>{Object.entries(ROLES).map(([k, r]) => <p key={k} className="small"><strong>{r.label}:</strong> {r.modules === '*' ? 'acesso total' : r.modules.join(', ')}</p>)}</div>
    </>
  )
}

// ---------------- Configurações ----------------
function SF({ s, setS, k, l, type = 'text', ph, area }) {
  return <Field label={l} id={'s-' + k}>{area ? <textarea id={'s-' + k} rows={2} className="input" placeholder={ph} value={s[k] ?? ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} /> : <input id={'s-' + k} type={type} className="input" placeholder={ph} value={s[k] ?? ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} />}</Field>
}
function Configuracoes() {
  const db = useDB()
  const [s, setS] = useState(db.settings)
  const [mail, setMail] = useState('')
  const save = (e) => { e.preventDefault(); setDB((d) => ({ settings: { ...d.settings, ...s, whatsapp: String(s.whatsapp || '').replace(/\D/g, ''), idadeMinima: +s.idadeMinima || 18, entradaPct: +s.entradaPct || 50, diariasMax: +s.diariasMax || 15, taxa: +s.taxa || 0 } })); toast('Configurações salvas') }
  const testMail = async () => {
    setMail('Enviando...')
    try { const r = await fetch('/api/admin', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + adminToken() }, body: JSON.stringify({ action: 'testmail' }) }).then((x) => x.json()); setMail(r.sent ? '✅ E-mail de teste enviado' : '⚠️ Não enviado: ' + (r.reason || r.error || '')) } catch (e) { setMail('⚠️ ' + e.message) }
  }
  return (
    <>
      <Top title="Configurações"><span className={'badge tone-' + (db.remote ? 'success' : 'warning')}>{db.remote ? 'Conectado ao servidor — alterações valem para todos' : 'Modo local (sem servidor)'}</span></Top>
      <form className="stack" onSubmit={save}>
        <div className="card grid g2" style={{ gap: 14 }}><h4 style={{ gridColumn: '1/-1', margin: 0 }}>Contato</h4>
          <SF s={s} setS={setS} k="whatsapp" l="WhatsApp (com DDI, só números)" ph="5562981047747" /><SF s={s} setS={setS} k="telefone" l="Telefone exibido" ph="(62) 98104-7747" />
          <SF s={s} setS={setS} k="instagram" l="Instagram" ph="@locajetoficial" /><SF s={s} setS={setS} k="instagramUrl" l="Link do Instagram" />
          <SF s={s} setS={setS} k="endereco" l="Endereço" ph="[INSERIR ENDEREÇO]" /><SF s={s} setS={setS} k="cidade" l="Cidade" />
          <SF s={s} setS={setS} k="mapsUrl" l="Link do Google Maps" /><SF s={s} setS={setS} k="diasFuncionamento" l="Dias de funcionamento" ph="Ex.: todos os dias" />
          <SF s={s} setS={setS} k="horarioRetirada" l="Horário de retirada" ph="Ex.: 8h" /><SF s={s} setS={setS} k="horarioDevolucao" l="Horário de devolução" ph="Ex.: 18h" />
        </div>
        <div className="card grid g2" style={{ gap: 14 }}><h4 style={{ gridColumn: '1/-1', margin: 0 }}>Notificações por e-mail</h4>
          <SF s={s} setS={setS} k="adminEmail" l="E-mail do administrador (recebe as novas reservas)" type="email" ph="dono@exemplo.com" />
          <div className="field"><label>Teste</label><div className="flex wrap"><button type="button" className="btn btn-ghost btn-sm" onClick={testMail} disabled={!db.remote}>Enviar e-mail de teste</button><small>{mail}</small></div></div>
          <small className="muted" style={{ gridColumn: '1/-1' }}>Salve antes de testar. O envio usa o serviço Resend (variável RESEND_API_KEY na Vercel) — ver SPEC.mdx.</small>
        </div>
        <div className="card grid g2" style={{ gap: 14 }}><h4 style={{ gridColumn: '1/-1', margin: 0 }}>Pagamento</h4>
          <SF s={s} setS={setS} k="entradaPct" l="Entrada para confirmar (%)" type="number" /><SF s={s} setS={setS} k="pixChave" l="Chave Pix" ph="[INSERIR CHAVE PIX]" />
          <SF s={s} setS={setS} k="cartaoPlataforma" l="Plataforma de cartão" ph="Ex.: Mercado Pago, InfinitePay..." /><SF s={s} setS={setS} k="cartaoLink" l="Link de pagamento no cartão" ph="https://..." />
          <SF s={s} setS={setS} k="taxa" l="Taxa fixa por reserva (R$)" type="number" />
        </div>
        <div className="card grid g2" style={{ gap: 14 }}><h4 style={{ gridColumn: '1/-1', margin: 0 }}>Regras da locação</h4>
          <SF s={s} setS={setS} k="idadeMinima" l="Idade mínima" type="number" /><SF s={s} setS={setS} k="diariasMax" l="Máximo de diárias por reserva" type="number" />
          <label className="flex small" style={{ gridColumn: '1/-1' }}><input type="checkbox" checked={!!s.exigeHabilitacao} onChange={(e) => setS({ ...s, exigeHabilitacao: e.target.checked })} /> Exibir/exigir aviso de habilitação de Motonauta</label>
          <div style={{ gridColumn: '1/-1' }}><SF s={s} setS={setS} k="textoHabilitacao" l="Texto sobre habilitação" area /></div>
          <SF s={s} setS={setS} k="documentos" l="Documentos necessários" area /><SF s={s} setS={setS} k="seguranca" l="Regras de segurança" area />
          <SF s={s} setS={setS} k="cancelamento" l="Regras de cancelamento" area ph="[A DEFINIR]" /><SF s={s} setS={setS} k="chuva" l="Política para chuva / mau tempo" area ph="[A DEFINIR]" />
        </div>
        <div><button className="btn btn-primary">Salvar configurações</button></div>
      </form>
      <div style={{ marginTop: 20 }}><Crud table="locations" title="Locais / pontos de retirada" rows={db.locations} newItem={{ ativo: true, regiao: 'Centro' }} cols={[{ l: 'Nome', k: 'nome' }, { l: 'Região', k: 'regiao' }, { l: 'Ativo', r: (l) => (l.ativo ? '✅' : '—') }]} fields={[{ k: 'nome', l: 'Nome', req: true }, { k: 'regiao', l: 'Região', type: 'select', options: ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'].map((v) => ({ v, l: v })) }, { k: 'descricao', l: 'Endereço / ponto de encontro', type: 'textarea' }, { k: 'ativo', l: 'Ativo', type: 'checkbox' }]} /></div>
      <div style={{ marginTop: 20 }}><Crud table="experiences" title="Experiências" rows={db.experiences} newItem={{ ativo: true, preco: 0, icon: '✨' }} cols={[{ l: '', k: 'icon' }, { l: 'Nome', k: 'nome' }, { l: 'Preço', r: (e) => brl(e.preco) }, { l: 'Ativo', r: (e) => (e.ativo ? '✅' : '—') }]} fields={[{ k: 'nome', l: 'Nome', req: true }, { k: 'icon', l: 'Ícone (emoji)' }, { k: 'preco', l: 'Preço adicional', type: 'number' }, { k: 'ativo', l: 'Ativo', type: 'checkbox' }, { k: 'descricao', l: 'Descrição', type: 'textarea' }]} /></div>
      <div style={{ marginTop: 20 }}><Crud table="services" title="Serviços adicionais (ative quando tiver valores)" rows={db.services} newItem={{ ativo: true, icon: '✨' }} cols={[{ l: '', k: 'icon' }, { l: 'Nome', k: 'nome' }, { l: 'Preço', r: (e) => brl(e.preco) }, { l: 'Ativo', r: (e) => (e.ativo ? '✅' : '—') }]} fields={[{ k: 'nome', l: 'Nome', req: true }, { k: 'icon', l: 'Ícone (emoji)' }, { k: 'preco', l: 'Preço', type: 'number', req: true }, { k: 'ativo', l: 'Ativo', type: 'checkbox' }, { k: 'descricao', l: 'Descrição', type: 'textarea' }]} /></div>
      <div className="card" style={{ marginTop: 20 }}><h4>Recarregar</h4><p className="small">Busca de novo os dados mais recentes do servidor.</p><div className="flex wrap"><button className="btn btn-ghost btn-sm" onClick={() => adminPull().then(() => toast('Dados atualizados'))} disabled={!db.remote}>Recarregar do servidor</button></div></div>
    </>
  )
}
