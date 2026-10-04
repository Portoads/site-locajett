import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDB, getDB, setDB, sha256, brl, fmtDate, tier, upsert, whatsNumber, waLink , today } from '../store'
import { Field, Badge, toast, JetArt, Modal } from '../components/ui'
import { PageHead } from '../components/Layout'
import { validCPF } from './MinhaReserva'
import { contractText } from './contract'

export function Login() {
  const [f, setF] = useState({ email: '', senha: '' })
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const next = new URLSearchParams(useLocation().search).get('next') || '/cliente'
  const submit = async (e) => {
    e.preventDefault()
    const h = await sha256(f.senha)
    const c = getDB().clients.find((x) => x.email.toLowerCase() === f.email.trim().toLowerCase())
    if (!c || !c.senhaHash || c.senhaHash !== h) return setErr('E-mail ou senha incorretos. Se você reservou sem conta, use "Criar conta" com o mesmo e-mail.')
    if (c.status === 'bloqueado') return setErr('Conta bloqueada. Fale com a Loca Jett.')
    setDB((d) => ({ session: { ...d.session, clientId: c.id } }))
    nav(next)
  }
  return (
    <>
      <PageHead eyebrow="Área do cliente" title="Entrar" />
      <section className="section" style={{ paddingTop: 40 }}><div className="container" style={{ maxWidth: 460 }}>
        <form className="card stack" onSubmit={submit}>
          <Field label="E-mail" id="l-e"><input id="l-e" type="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
          <Field label="Senha" id="l-s"><input id="l-s" type="password" required className="input" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="current-password" /></Field>
          {err && <span className="err-msg" role="alert">{err}</span>}
          <button className="btn btn-primary">Entrar</button>
          <p className="small" style={{ textAlign: 'center' }}>Novo por aqui? <Link to="/cadastro" style={{ color: 'var(--primary)' }}>Criar conta</Link></p>
          <p className="small muted" style={{ textAlign: 'center' }}>É da equipe? <Link to="/admin" style={{ color: 'var(--primary)' }}>Painel administrativo</Link></p>
        </form>
      </div></section>
    </>
  )
}

export function Cadastro() {
  const [f, setF] = useState({ nome: '', email: '', telefone: '', cpf: '', senha: '', senha2: '', aceite: false, indicacao: new URLSearchParams(location.search).get('ref') || '' })
  const [err, setErr] = useState({})
  const nav = useNavigate()
  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (f.nome.trim().split(' ').length < 2) er.nome = 'Nome e sobrenome'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'E-mail inválido'
    if (f.telefone.replace(/\D/g, '').length < 10) er.telefone = 'Telefone inválido'
    if (f.cpf && !validCPF(f.cpf)) er.cpf = 'CPF inválido'
    if (f.senha.length < 8) er.senha = 'Mínimo de 8 caracteres'
    if (f.senha !== f.senha2) er.senha2 = 'As senhas não conferem'
    if (!f.aceite) er.aceite = 'Aceite os termos'
    setErr(er)
    if (Object.keys(er).length) return
    const d = getDB()
    const exist = d.clients.find((x) => x.email.toLowerCase() === f.email.toLowerCase())
    if (exist?.senhaHash) return setErr({ email: 'Já existe conta com este e-mail. Faça login.' })
    const senhaHash = await sha256(f.senha)
    const ref = d.clients.find((x) => x.refCode === f.indicacao.trim().toUpperCase())
    const c = exist ? { ...exist, senhaHash } : { id: 'c' + Date.now().toString(36), nome: f.nome.trim(), email: f.email.trim(), telefone: f.telefone, whatsapp: '55' + f.telefone.replace(/\D/g, ''), cpf: f.cpf, cidade: '', estado: 'GO', status: 'ativo', createdAt: today(), pontos: 0, refCode: 'AMIGO-' + Math.random().toString(36).slice(2, 7).toUpperCase(), indicadoPor: ref?.id, senhaHash }
    upsert('clients', c)
    setDB((dd) => ({ session: { ...dd.session, clientId: c.id } }))
    toast('Conta criada! Bem-vindo à Loca Jett 🌊')
    nav('/cliente')
  }
  const inp = (k, label, type = 'text', ac) => <Field label={label} id={'r-' + k} error={err[k]}><input id={'r-' + k} type={type} className={'input ' + (err[k] ? 'err' : '')} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={ac} /></Field>
  return (
    <>
      <PageHead eyebrow="Área do cliente" title="Criar conta" text="Acompanhe reservas, pagamentos, contratos e pontos de fidelidade." />
      <section className="section" style={{ paddingTop: 40 }}><div className="container" style={{ maxWidth: 560 }}>
        <form className="card stack" onSubmit={submit} noValidate>
          {inp('nome', 'Nome completo', 'text', 'name')}
          <div className="grid g2" style={{ gap: 12 }}>{inp('email', 'E-mail', 'email', 'email')}{inp('telefone', 'WhatsApp', 'tel', 'tel')}</div>
          <div className="grid g2" style={{ gap: 12 }}>{inp('cpf', 'CPF (opcional)')}{inp('indicacao', 'Código de indicação')}</div>
          <div className="grid g2" style={{ gap: 12 }}>{inp('senha', 'Senha', 'password', 'new-password')}{inp('senha2', 'Confirmar senha', 'password', 'new-password')}</div>
          <label className="flex small"><input type="checkbox" checked={f.aceite} onChange={(e) => setF({ ...f, aceite: e.target.checked })} /> Aceito os termos e a política de privacidade (LGPD).</label>{err.aceite && <span className="err-msg">{err.aceite}</span>}
          <button className="btn btn-primary">Criar conta</button>
          <p className="small" style={{ textAlign: 'center' }}>Já tem conta? <Link to="/login" style={{ color: 'var(--primary)' }}>Entrar</Link></p>
        </form>
      </div></section>
    </>
  )
}

const CLI_LINKS = [['/cliente', 'Início', '🏠'], ['/cliente/reservas', 'Reservas', '📅'], ['/cliente/locacoes', 'Locações', '🌊'], ['/cliente/pagamentos', 'Pagamentos', '💳'], ['/cliente/contratos', 'Contratos', '📄'], ['/cliente/perfil', 'Perfil', '👤']]
export function ClienteLayout() {
  const db = useDB()
  const me = db.clients.find((c) => c.id === db.session.clientId)
  if (!me) return <Navigate to="/login?next=/cliente" replace />
  return (
    <>
      <PageHead eyebrow={`Nível ${tier(me.pontos || 0)} · ${me.pontos || 0} pontos`} title={`Olá, ${me.nome.split(' ')[0]} 🌊`} />
      <section className="section" style={{ paddingTop: 24 }}><div className="container">
        <div className="flex wrap" style={{ marginBottom: 24 }}>{CLI_LINKS.map(([to, l, i]) => <NavLink key={to} to={to} end className={({ isActive }) => 'chip ' + (isActive ? 'on' : '')}>{i} {l}</NavLink>)}<button className="chip" onClick={() => setDB((d) => ({ session: { ...d.session, clientId: null } }))}>Sair</button></div>
        <Outlet context={me} />
      </div></section>
    </>
  )
}
const useMe = () => { const db = useDB(); return [db, db.clients.find((c) => c.id === db.session.clientId)] }
const ResRow = ({ r, db }) => { const j = db.jetskis.find((x) => x.id === r.jetId); return <tr><td><strong>{r.id}</strong></td><td>{j?.marca} {j?.modelo}</td><td>{fmtDate(r.data)} {r.hora}</td><td>{r.duracao}h</td><td>{brl(r.total)}</td><td><Badge status={r.status} /></td></tr> }

export function ClienteHome() {
  const [db, me] = useMe()
  const mine = db.reservations.filter((r) => r.clientId === me.id)
  const next = mine.filter((r) => r.data >= today() && r.status !== 'cancelada').sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]
  const j = next && db.jetskis.find((x) => x.id === next.jetId)
  const loc = next && db.locations.find((x) => x.id === next.localId)
  const t = tier(me.pontos || 0)
  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="card">
        <h3>Próxima reserva</h3>
        {next ? <><div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/7', margin: '12px 0' }}><JetArt hue={j?.hue} /></div>
          {[['Reserva', next.id], ['Jet Ski', `${j?.marca} ${j?.modelo}`], ['Data', fmtDate(next.data)], ['Horário', next.hora], ['Local', loc?.nome], ['Valor', brl(next.total)]].map(([k, v]) => <div className="line" key={k}><span>{k}</span><strong>{v}</strong></div>)}
          <Badge status={next.status} /></> : <div className="empty">Nenhuma reserva futura.<br /><Link to="/jet-skis" className="btn btn-primary" style={{ marginTop: 12 }}>Reservar agora</Link></div>}
      </div>
      <div className="stack">
        <div className="card"><h3>Fidelidade — {t}</h3><p className="small">Ganhe 1 ponto a cada R$ 1 em experiências concluídas. Bronze → Prata (400) → Ouro (1000) → VIP (2000).</p>
          <div className="hbar"><i style={{ width: Math.min(100, ((me.pontos || 0) / 2000) * 100) + '%' }} /></div><small className="muted">{me.pontos || 0} pontos</small></div>
        <div className="card"><h3>Indique amigos</h3><p className="small">Compartilhe seu código. Quando seu amigo reservar, vocês ganham benefícios.</p>
          <div className="flex"><input className="input" readOnly value={`${location.origin}/cadastro?ref=${me.refCode}`} aria-label="Link de indicação" /><button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/cadastro?ref=${me.refCode}`); toast('Link copiado!') }}>Copiar</button></div>
          <small className="muted">Código: {me.refCode} · Indicados: {db.clients.filter((c) => c.indicadoPor === me.id).length}</small></div>
      </div>
    </div>
  )
}

export function ClienteReservas() {
  const [db, me] = useMe()
  const [rev, setRev] = useState(null)
  const mine = db.reservations.filter((r) => r.clientId === me.id).sort((a, b) => b.data.localeCompare(a.data))
  return (
    <div className="card"><h3>Minhas reservas</h3>
      {mine.length ? <div className="table-wrap"><table><thead><tr><th>Nº</th><th>Jet Ski</th><th>Data</th><th>Duração</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>{mine.map((r) => { const j = db.jetskis.find((x) => x.id === r.jetId); const reviewed = db.reviews.some((v) => v.reservaId === r.id); return <tr key={r.id}><td><strong>{r.id}</strong></td><td>{j?.marca} {j?.modelo}</td><td>{fmtDate(r.data)} {r.hora}</td><td>{r.duracao}h</td><td>{brl(r.total)}</td><td><Badge status={r.status} /></td><td>{r.status === 'concluida' && !reviewed ? <button className="btn btn-ghost btn-sm" onClick={() => setRev(r)}>⭐ Avaliar</button> : <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), `Olá! Sobre a minha reserva ${r.id}...`)}>WhatsApp</a>}</td></tr> })}</tbody></table></div> : <div className="empty">Você ainda não tem reservas.</div>}
      <ReviewModal r={rev} me={me} onClose={() => setRev(null)} />
    </div>
  )
}
function ReviewModal({ r, me, onClose }) {
  const [v, setV] = useState({ atendimento: 5, jetski: 5, experiencia: 5, facilidade: 5, geral: 5, comentario: '' })
  if (!r) return null
  return (
    <Modal open onClose={onClose} title={`Avaliar ${r.id}`}>
      <div className="stack">{['atendimento', 'jetski', 'experiencia', 'facilidade', 'geral'].map((k) => <div key={k} className="flex between"><span style={{ textTransform: 'capitalize' }}>{k === 'jetski' ? 'Jet Ski' : k}</span><span>{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setV({ ...v, [k]: n })} aria-label={`${n} estrelas`} style={{ background: 'none', border: 0, fontSize: 22, cursor: 'pointer', opacity: n <= v[k] ? 1 : 0.3 }}>⭐</button>)}</span></div>)}
        <textarea className="input" rows={3} placeholder="Conte como foi" value={v.comentario} onChange={(e) => setV({ ...v, comentario: e.target.value })} />
        <button className="btn btn-primary" onClick={() => { upsert('reviews', { ...v, clientId: me.id, reservaId: r.id, resposta: '', visivel: true, data: today() }); toast('Obrigado pela avaliação!'); onClose() }}>Enviar avaliação</button></div>
    </Modal>
  )
}

export function ClienteLocacoes() {
  const [db, me] = useMe()
  const done = db.reservations.filter((r) => r.clientId === me.id && r.status === 'concluida')
  return <div className="card"><h3>Experiências anteriores</h3>{done.length ? <div className="table-wrap"><table><thead><tr><th>Nº</th><th>Jet Ski</th><th>Data</th><th>Duração</th><th>Total</th><th>Status</th></tr></thead><tbody>{done.map((r) => <ResRow key={r.id} r={r} db={db} />)}</tbody></table></div> : <div className="empty">Nenhuma locação concluída ainda.</div>}</div>
}

export function ClientePagamentos() {
  const [db, me] = useMe()
  const mine = db.reservations.filter((r) => r.clientId === me.id && r.status !== 'cancelada')
  const pago = mine.filter((r) => r.pagamento === 'pago').reduce((a, r) => a + r.total, 0)
  const pend = mine.filter((r) => r.pagamento !== 'pago').reduce((a, r) => a + r.total, 0)
  return (
    <div className="stack">
      <div className="grid g2"><div className="card kpi"><span>Pago</span><strong style={{ color: 'var(--success)' }}>{brl(pago)}</strong></div><div className="card kpi"><span>Pendente</span><strong style={{ color: 'var(--warning)' }}>{brl(pend)}</strong></div></div>
      <div className="card"><div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Data</th><th>Valor</th><th>Desconto</th><th>Status</th><th>Comprovante</th></tr></thead><tbody>{mine.map((r) => <tr key={r.id}><td>{r.id}</td><td>{fmtDate(r.data)}</td><td>{brl(r.total)}</td><td>{brl(r.desconto)}</td><td><span className={'badge tone-' + (r.pagamento === 'pago' ? 'success' : 'warning')}>{r.pagamento === 'pago' ? 'Pago' : 'Pendente'}</span></td><td>{r.pagamento === 'pago' ? <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Imprimir</button> : '—'}</td></tr>)}</tbody></table></div>
        <p className="small muted" style={{ marginTop: 12 }}>Pagamento online (PIX/cartão) — integração preparada, ver SPEC.mdx.</p></div>
    </div>
  )
}

export function ClienteContratos() {
  const [db, me] = useMe()
  const [view, setView] = useState(null)
  const list = db.contracts.filter((c) => c.clientId === me.id)
  const sign = (c) => { upsert('contracts', { ...c, assinadoCliente: new Date().toISOString(), status: 'assinado' }); toast('Contrato assinado digitalmente ✍️'); setView(null) }
  return (
    <div className="card"><h3>Meus contratos</h3>
      {list.length ? <div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Gerado em</th><th>Status</th><th></th></tr></thead><tbody>{list.map((c) => <tr key={c.id}><td>{c.reservaId}</td><td>{fmtDate(c.criado?.slice(0, 10))}</td><td><span className={'badge tone-' + (c.status === 'assinado' ? 'success' : 'warning')}>{c.status === 'assinado' ? 'Assinado' : 'Aguardando assinatura'}</span></td><td><button className="btn btn-ghost btn-sm" onClick={() => setView(c)}>Abrir</button></td></tr>)}</tbody></table></div> : <div className="empty">Os contratos aparecem aqui após a confirmação da reserva.</div>}
      <Modal open={!!view} onClose={() => setView(null)} title={`Contrato — ${view?.reservaId}`} width="820px">
        {view && <><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '.85rem', color: 'var(--text-secondary)' }}>{contractText(getDB(), view.reservaId)}</pre>
          <div className="flex wrap">{view.status !== 'assinado' && <button className="btn btn-primary" onClick={() => sign(view)}>✍️ Assinar digitalmente</button>}<button className="btn btn-ghost" onClick={() => { const w = window.open(''); w.document.write(`<pre style="font-family:sans-serif;white-space:pre-wrap;padding:32px">${contractText(getDB(), view.reservaId).replace(/</g, '&lt;')}</pre>`); w.print() }}>Baixar PDF</button></div></>}
      </Modal>
    </div>
  )
}

export function ClientePerfil() {
  const [, me] = useMe()
  const [f, setF] = useState(me)
  return (
    <form className="card stack" style={{ maxWidth: 640 }} onSubmit={(e) => { e.preventDefault(); upsert('clients', f); toast('Perfil atualizado') }}>
      <h3>Meu perfil</h3>
      {[['nome', 'Nome'], ['email', 'E-mail'], ['telefone', 'WhatsApp'], ['cidade', 'Cidade'], ['estado', 'Estado'], ['endereco', 'Endereço'], ['cep', 'CEP']].map(([k, l]) => <Field key={k} label={l} id={'p-' + k}><input id={'p-' + k} className="input" value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>)}
      <button className="btn btn-primary">Salvar</button>
    </form>
  )
}
