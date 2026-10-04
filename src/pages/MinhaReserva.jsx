import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDB, getDB, setDB, updateCart, clearCart, calcCart, slotsFor, DURACOES, brl, fmtDate, weekday, genCode, buildWhatsMessage, whatsNumber, waLink, notify, findCoupon , today } from '../store'
import { JetArt, Field, toast, WaIcon, Badge } from '../components/ui'
import { PageHead } from '../components/Layout'
import Calendar from '../components/Calendar'

const STEPS = ['Jet Ski', 'Data e horário', 'Experiência', 'Dados pessoais', 'Resumo', 'Finalização']
export const validCPF = (v) => {
  const c = (v || '').replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  const calc = (n) => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return calc(9) === +c[9] && calc(10) === +c[10]
}
const mask = {
  cpf: (v) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
  tel: (v) => v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2'),
  cep: (v) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'),
}
export const validateClient = (c) => {
  const e = {}
  if (!c.nome || c.nome.trim().split(' ').length < 2) e.nome = 'Informe nome e sobrenome'
  if (!validCPF(c.cpf)) e.cpf = 'CPF inválido'
  if ((c.telefone || '').replace(/\D/g, '').length < 10) e.telefone = 'Telefone inválido'
  if (!/^\S+@\S+\.\S+$/.test(c.email || '')) e.email = 'E-mail inválido'
  if (!c.nascimento) e.nascimento = 'Informe a data de nascimento'
  else { const age = (Date.now() - new Date(c.nascimento)) / 31557600000; if (age < 18) e.nascimento = 'O titular da reserva deve ter 18 anos ou mais' }
  if (!c.cidade) e.cidade = 'Informe a cidade'
  if (!c.estado) e.estado = 'Informe o estado'
  if (!c.aceite) e.aceite = 'É necessário aceitar os termos'
  return e
}

export default function MinhaReserva() {
  const db = useDB()
  const cart = db.cart
  const [step, setStep] = useState(0)
  const [err, setErr] = useState({})
  const [done, setDone] = useState(null)
  const c = calcCart(cart)
  const logged = db.clients.find((x) => x.id === db.session.clientId)
  const cli = { estado: 'GO', ...(logged || {}), ...(cart?.cliente || {}) }
  const slots = useMemo(() => (cart?.jetId && cart?.data ? slotsFor(cart.jetId, cart.data, cart.duracao) : []), [cart?.jetId, cart?.data, cart?.duracao, db.reservations])
  const setCli = (k, v) => updateCart({ cliente: { ...cli, [k]: v } })

  // Recuperação de reservas abandonadas
  useEffect(() => {
    if (!cart?.jetId || done) return
    setDB((d) => {
      const rest = d.abandoned.filter((a) => a.startedAt !== cart.startedAt)
      return { abandoned: [{ startedAt: cart.startedAt, jetId: cart.jetId, etapa: STEPS[step], nome: cli.nome || '', telefone: cli.telefone || '', email: cli.email || '', total: c.total, atualizado: new Date().toISOString() }, ...rest].slice(0, 200) }
    })
  }, [step, cart?.jetId, cli.telefone, cli.email])

  if (done) {
    return (
      <>
        <PageHead eyebrow="Reserva criada" title={`Reserva nº ${done.id}`} text="Sua reserva foi registrada e a mensagem foi preparada no WhatsApp. Nossa equipe vai confirmar a disponibilidade e os próximos passos." />
        <section className="section" style={{ paddingTop: 40 }}><div className="container" style={{ maxWidth: 720 }}>
          <div className="card stack" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>🌊</div><Badge status={done.status} />
            <h2 style={{ margin: 0 }}>{done.id}</h2><p>Guarde este número. Ele aparece no WhatsApp, na sua área do cliente e no contrato.</p>
            <a className="btn btn-wa" href={done.link} target="_blank" rel="noreferrer"><WaIcon size={18} /> Abrir WhatsApp novamente</a>
            <div className="flex wrap" style={{ justifyContent: 'center' }}><Link to="/cliente/reservas" className="btn btn-ghost">Ver na área do cliente</Link><Link to="/jet-skis" className="btn btn-ghost">Nova reserva</Link></div>
          </div>
        </div></section>
      </>
    )
  }

  if (!cart?.jetId) {
    return (
      <>
        <PageHead eyebrow="🛒 Minha Reserva" title="Sua reserva está vazia" text="Escolha um Jet Ski para começar sua experiência." />
        <section className="section" style={{ paddingTop: 40 }}><div className="container"><Link to="/jet-skis" className="btn btn-primary">Ver Jet Skis</Link></div></section>
      </>
    )
  }

  const canGo = (s) => {
    if (s >= 2 && (!cart.data || !cart.hora || !slots.includes(cart.hora))) return 1
    if (s >= 4 && Object.keys(validateClient(cli)).length) return 3
    return s
  }
  const go = (s) => {
    const ok = canGo(s)
    if (ok !== s) {
      if (ok === 1) toast('Escolha uma data e um horário disponível')
      if (ok === 3) setErr(validateClient(cli))
      setStep(ok); return
    }
    setErr({}); setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finalize = () => {
    // 1. validar  2. disponibilidade  3. salvar  4. número  5. total  6. mensagem  7. WhatsApp
    const e = validateClient(cli)
    if (Object.keys(e).length) { setErr(e); setStep(3); return }
    if (!slotsFor(cart.jetId, cart.data, cart.duracao).includes(cart.hora)) { toast('Esse horário acabou de ficar indisponível. Escolha outro.'); setStep(1); return }
    const d = getDB()
    let client = d.clients.find((x) => x.email.toLowerCase() === cli.email.toLowerCase())
    const clientData = { nome: cli.nome.trim(), cpf: cli.cpf, telefone: cli.telefone, whatsapp: '55' + cli.telefone.replace(/\D/g, ''), email: cli.email.trim(), nascimento: cli.nascimento, endereco: cli.endereco || '', cidade: cli.cidade, estado: cli.estado, cep: cli.cep || '' }
    const isNew = !client
    client = client ? { ...client, ...clientData } : { id: 'c' + Date.now().toString(36), ...clientData, status: 'ativo', createdAt: today(), pontos: 0, refCode: 'AMIGO-' + Math.random().toString(36).slice(2, 7).toUpperCase(), indicadoPor: cli.indicacao ? d.clients.find((x) => x.refCode === cli.indicacao.toUpperCase())?.id : undefined }
    const id = genCode()
    const r = { id, clientId: client.id, jetId: cart.jetId, data: cart.data, hora: cart.hora, duracao: cart.duracao, pessoas: cart.pessoas, localId: cart.localId, servicos: cart.servicos, experienciaId: cart.experienciaId, subtotal: c.base, adicionais: c.adicionais, desconto: c.desconto, taxas: c.taxas, caucao: c.caucao, total: c.total, cupom: c.coupon?.codigo || '', status: 'aguardando_atendimento', pagamento: 'pendente', obs: cli.obs || '', createdAt: new Date().toISOString() }
    setDB((db2) => ({
      clients: isNew ? [...db2.clients, client] : db2.clients.map((x) => (x.id === client.id ? client : x)),
      reservations: [...db2.reservations, r],
      coupons: c.coupon ? db2.coupons.map((k) => (k.id === c.coupon.id ? { ...k, usos: k.usos + 1 } : k)) : db2.coupons,
      abandoned: db2.abandoned.filter((a) => a.startedAt !== cart.startedAt),
      session: { ...db2.session, clientId: db2.session.clientId || client.id },
    }))
    notify('reserva', `Nova reserva ${id} — ${client.nome} — ${brl(r.total)}`)
    if (isNew) notify('cliente', `Novo cliente: ${client.nome}`)
    const link = waLink(whatsNumber(), buildWhatsMessage(r, client))
    window.open(link, '_blank')
    clearCart()
    setDone({ ...r, link })
  }

  const coupon = cart.cupom ? findCoupon(cart.cupom, c.base + c.adicionais, cart.jetId) : null
  return (
    <>
      <PageHead eyebrow="🛒 Minha Reserva" title="Finalize sua experiência" />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="steps" role="tablist">{STEPS.map((s, i) => <button key={s} role="tab" aria-selected={step === i} className={'step ' + (step === i ? 'on' : step > i ? 'done' : '')} onClick={() => go(i)}><b>{step > i ? '✓' : i + 1}</b>{s}</button>)}</div>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24 }} id="mr-grid">
            <div className="card">
              {step === 0 && <div className="stack"><h3>1. Jet Ski escolhido</h3>
                <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/8' }}><JetArt hue={c.jet.hue} /></div>
                <h3>{c.jet.marca} {c.jet.modelo}</h3><p className="small">{c.jet.descricao}</p>
                <Field label="Trocar Jet Ski" id="mr-j"><select id="mr-j" className="input" value={cart.jetId} onChange={(e) => { const j = db.jetskis.find((x) => x.id === e.target.value); updateCart({ jetId: j.id, localId: j.localId, hora: '' }) }}>{db.jetskis.filter((j) => !['manutencao', 'indisponivel'].includes(j.status)).map((j) => <option key={j.id} value={j.id}>{j.marca} {j.modelo} — {brl(j.precoHora)}/h</option>)}</select></Field>
                <Field label="Pessoas" id="mr-p"><select id="mr-p" className="input" value={cart.pessoas} onChange={(e) => updateCart({ pessoas: +e.target.value })}>{Array.from({ length: c.jet.capacidade }, (_, i) => <option key={i}>{i + 1}</option>)}</select></Field>
                <Field label="Local" id="mr-l"><select id="mr-l" className="input" value={cart.localId} onChange={(e) => updateCart({ localId: e.target.value })}>{db.locations.filter((l) => l.ativo).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></Field>
                <button className="btn btn-primary" onClick={() => go(1)}>Continuar →</button></div>}
              {step === 1 && <div className="stack"><h3>2. Data e horário</h3>
                <Calendar jetId={cart.jetId} value={cart.data} onChange={(data) => updateCart({ data, hora: '' })} />
                <h4>Duração</h4><div className="flex wrap">{DURACOES.map((d) => <button key={d.h} className={'chip ' + (cart.duracao === d.h ? 'on' : '')} onClick={() => updateCart({ duracao: d.h, hora: '' })}>{d.label}</button>)}</div>
                <h4>Horário</h4>{!cart.data ? <p className="small muted">Escolha uma data.</p> : slots.length ? <div className="slots">{slots.map((s) => <button key={s} className={'chip ' + (cart.hora === s ? 'on' : '')} onClick={() => updateCart({ hora: s })}>{s}</button>)}</div> : <p className="small" style={{ color: 'var(--warning)' }}>Sem horários livres para essa duração.</p>}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(0)}>← Voltar</button><button className="btn btn-primary" onClick={() => go(2)}>Continuar →</button></div></div>}
              {step === 2 && <div className="stack"><h3>3. Experiência e adicionais</h3>
                <div className="grid g2" style={{ gap: 10 }}>{db.experiences.filter((e) => e.ativo).map((e) => <button key={e.id} className="card" style={{ textAlign: 'left', padding: 14, cursor: 'pointer', borderColor: cart.experienciaId === e.id ? 'var(--primary)' : undefined }} onClick={() => updateCart({ experienciaId: e.id })}><div>{e.icon} <strong>{e.nome}</strong></div><small className="muted">{e.descricao}</small><div style={{ fontWeight: 700 }}>{e.preco ? '+ ' + brl(e.preco) : 'Incluso'}</div></button>)}</div>
                <h4>Serviços adicionais</h4>
                {db.services.filter((s) => s.ativo).map((s) => <label key={s.id} className="flex between card" style={{ padding: 12, cursor: 'pointer' }}><span>{s.icon} {s.nome} <small className="muted">— {s.descricao}</small></span><span className="flex"><strong>{brl(s.preco)}</strong><input type="checkbox" checked={cart.servicos.includes(s.id)} onChange={() => updateCart({ servicos: cart.servicos.includes(s.id) ? cart.servicos.filter((x) => x !== s.id) : [...cart.servicos, s.id] })} /></span></label>)}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(1)}>← Voltar</button><button className="btn btn-primary" onClick={() => go(3)}>Continuar →</button></div></div>}
              {step === 3 && <div className="stack"><h3>4. Seus dados</h3>
                {!logged && <p className="small">Já tem conta? <Link to="/login?next=/minha-reserva" style={{ color: 'var(--primary)' }}>Entrar</Link> para preencher automaticamente.</p>}
                <div className="grid g2" style={{ gap: 14 }}>
                  <Field label="Nome completo *" id="f-n" error={err.nome}><input id="f-n" className={'input ' + (err.nome ? 'err' : '')} value={cli.nome || ''} onChange={(e) => setCli('nome', e.target.value)} autoComplete="name" /></Field>
                  <Field label="CPF *" id="f-c" error={err.cpf}><input id="f-c" inputMode="numeric" className={'input ' + (err.cpf ? 'err' : '')} value={cli.cpf || ''} onChange={(e) => setCli('cpf', mask.cpf(e.target.value))} placeholder="000.000.000-00" /></Field>
                  <Field label="Telefone / WhatsApp *" id="f-t" error={err.telefone}><input id="f-t" inputMode="tel" className={'input ' + (err.telefone ? 'err' : '')} value={cli.telefone || ''} onChange={(e) => setCli('telefone', mask.tel(e.target.value))} placeholder="(62) 90000-0000" autoComplete="tel" /></Field>
                  <Field label="E-mail *" id="f-e" error={err.email}><input id="f-e" type="email" className={'input ' + (err.email ? 'err' : '')} value={cli.email || ''} onChange={(e) => setCli('email', e.target.value)} autoComplete="email" /></Field>
                  <Field label="Data de nascimento *" id="f-b" error={err.nascimento}><input id="f-b" type="date" className={'input ' + (err.nascimento ? 'err' : '')} value={cli.nascimento || ''} onChange={(e) => setCli('nascimento', e.target.value)} /></Field>
                  <Field label="CEP" id="f-z"><input id="f-z" inputMode="numeric" className="input" value={cli.cep || ''} onChange={(e) => setCli('cep', mask.cep(e.target.value))} /></Field>
                  <Field label="Endereço" id="f-a"><input id="f-a" className="input" value={cli.endereco || ''} onChange={(e) => setCli('endereco', e.target.value)} autoComplete="street-address" /></Field>
                  <Field label="Cidade *" id="f-ci" error={err.cidade}><input id="f-ci" className={'input ' + (err.cidade ? 'err' : '')} value={cli.cidade || ''} onChange={(e) => setCli('cidade', e.target.value)} /></Field>
                  <Field label="Estado *" id="f-uf" error={err.estado}><input id="f-uf" className={'input ' + (err.estado ? 'err' : '')} value={cli.estado || ''} onChange={(e) => setCli('estado', e.target.value.toUpperCase().slice(0, 2))} /></Field>
                  <Field label="Código de indicação" id="f-r"><input id="f-r" className="input" value={cli.indicacao || ''} onChange={(e) => setCli('indicacao', e.target.value)} placeholder="AMIGO-XXXXX" /></Field>
                </div>
                <Field label="Observações" id="f-o"><textarea id="f-o" rows={3} className="input" value={cli.obs || ''} onChange={(e) => setCli('obs', e.target.value)} /></Field>
                <p className="small muted">📄 Documentos necessários no dia: documento oficial com foto e, se for pilotar, habilitação náutica.</p>
                <label className="flex small"><input type="checkbox" checked={!!cli.aceite} onChange={(e) => setCli('aceite', e.target.checked)} /> Li e aceito os termos de locação e a política de privacidade (LGPD).</label>{err.aceite && <span className="err-msg">{err.aceite}</span>}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(2)}>← Voltar</button><button className="btn btn-primary" onClick={() => go(4)}>Revisar →</button></div></div>}
              {step === 4 && <div className="stack"><h3>5. Resumo da reserva</h3>
                {[['🌊 Jet Ski', `${c.jet.marca} ${c.jet.modelo}`], ['📅 Data', `${weekday(cart.data)}, ${fmtDate(cart.data)}`], ['⏰ Horário', cart.hora], ['⏱️ Duração', cart.duracao + 'h'], ['📍 Local', db.locations.find((l) => l.id === cart.localId)?.nome], ['👥 Pessoas', cart.pessoas], ['✨ Experiência', c.exp?.nome], ['👤 Titular', cli.nome], ['✉️ E-mail', cli.email], ['📱 WhatsApp', cli.telefone]].map(([k, v]) => <div key={k} className="line"><span>{k}</span><strong>{v}</strong></div>)}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(3)}>← Editar dados</button><button className="btn btn-primary" onClick={() => go(5)}>Tudo certo →</button></div></div>}
              {step === 5 && <div className="stack" style={{ textAlign: 'center' }}><div style={{ fontSize: 52 }}>💬</div><h3>6. Finalizar pelo WhatsApp</h3>
                <p>Ao confirmar, sua reserva recebe um número único (LJ-XXXXXX), é registrada no sistema e o WhatsApp abre com a mensagem pronta para a equipe Loca Jett.</p>
                <p className="small muted">Por segurança, CPF e endereço não são enviados no WhatsApp.</p>
                <button className="btn btn-wa btn-block" onClick={finalize}><WaIcon size={20} /> Finalizar Reserva pelo WhatsApp</button>
                <button className="btn btn-ghost" onClick={() => go(4)}>← Voltar ao resumo</button></div>}
            </div>
            <aside>
              <div className="card" style={{ position: 'sticky', top: 96 }}>
                <h3>🛒 Minha Reserva</h3>
                <div className="flex" style={{ alignItems: 'flex-start' }}><div style={{ width: 96, borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', flexShrink: 0 }}><JetArt hue={c.jet.hue} /></div><div><strong>{c.jet.marca} {c.jet.modelo}</strong><div className="small muted">{cart.data ? `${fmtDate(cart.data)} · ${cart.hora || '--:--'}` : 'Data a definir'} · {cart.duracao}h · {cart.pessoas} pessoa(s)</div></div></div>
                <div className="divider" />
                <div className="line"><span>Jet Ski ({cart.duracao}h)</span><strong>{brl(c.base)}</strong></div>
                {c.itens.map((i) => <div key={i.nome} className="line"><span>{i.icon} {i.nome}</span><strong>{brl(i.preco)}</strong></div>)}
                <div className="flex" style={{ margin: '8px 0' }}><input className="input" placeholder="Cupom de desconto" value={cart.cupom} onChange={(e) => updateCart({ cupom: e.target.value.toUpperCase() })} aria-label="Cupom" /></div>
                {cart.cupom && <small style={{ color: coupon ? 'var(--success)' : 'var(--danger)' }}>{coupon ? `Cupom ${coupon.codigo} aplicado` : 'Cupom inválido ou não aplicável'}</small>}
                <div className="line"><span>Descontos</span><strong style={{ color: 'var(--success)' }}>-{brl(c.desconto)}</strong></div>
                <div className="line"><span>Taxas</span><strong>{brl(c.taxas)}</strong></div>
                <div className="line"><span>Caução (devolvível)</span><strong>{brl(c.caucao)}</strong></div>
                <div className="divider" />
                <div className="total"><span>Total</span><span>{brl(c.total)}</span></div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 900px){ #mr-grid{ grid-template-columns: 1fr !important } }`}</style>
    </>
  )
}
