import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDB, getDB, setDB, updateCart, clearCart, calcCart, brl, fmtDate, weekday, genCode, buildWhatsMessage, whatsNumber, waLink, notify, today, rangeConflict, maxDiarias, rangeEnd, diariasLabel, checkCouponRemote, submitReservationRemote, PAGAMENTO } from '../store'
import { JetPhoto, Field, toast, WaIcon, Badge } from '../components/ui'
import { PageHead } from '../components/Layout'
import Calendar from '../components/Calendar'

const STEPS = ['Jet Ski', 'Data e diárias', 'Adicionais', 'Dados pessoais', 'Resumo e pagamento', 'Finalização']
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
  const s = getDB().settings
  const e = {}
  if (!c.nome || c.nome.trim().split(' ').length < 2) e.nome = 'Informe nome e sobrenome'
  if (!validCPF(c.cpf)) e.cpf = 'CPF inválido'
  if ((c.telefone || '').replace(/\D/g, '').length < 10) e.telefone = 'Telefone inválido'
  if (!/^\S+@\S+\.\S+$/.test(c.email || '')) e.email = 'E-mail inválido'
  if (!c.nascimento) e.nascimento = 'Informe a data de nascimento'
  else { const age = (Date.now() - new Date(c.nascimento)) / 31557600000; if (age < (Number(s.idadeMinima) || 18)) e.nascimento = `Idade mínima: ${s.idadeMinima || 18} anos` }
  if (!c.cidade) e.cidade = 'Informe a cidade'
  if (!c.estado) e.estado = 'Informe o estado'
  if (s.exigeHabilitacao && !c.habilitacao) e.habilitacao = 'Confirme a informação sobre habilitação'
  if (!c.aceite) e.aceite = 'É necessário aceitar os termos'
  return e
}

export function DiariasPicker({ jetId, data, value, onChange }) {
  useDB()
  const max = data ? Math.max(1, maxDiarias(jetId, data)) : Number(getDB().settings.diariasMax) || 15
  return (
    <div className="flex wrap" style={{ alignItems: 'center' }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="Menos uma diária">−</button>
      <strong style={{ minWidth: 110, textAlign: 'center', fontSize: '1.1rem' }}>{diariasLabel(value)}</strong>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Mais uma diária">+</button>
      {data && <small className="muted">Devolução: {weekday(rangeEnd(data, value))}, {fmtDate(rangeEnd(data, value))}{max < (Number(getDB().settings.diariasMax) || 15) ? ` · máx. ${max} seguidas nessa data` : ''}</small>}
    </div>
  )
}

export default function MinhaReserva() {
  const db = useDB()
  const cart = db.cart
  const s = db.settings
  const [step, setStep] = useState(0)
  const [err, setErr] = useState({})
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  const c = calcCart(cart)
  const logged = db.clients.find((x) => x.id === db.session.clientId)
  const cli = { estado: 'GO', ...(logged || {}), ...(cart?.cliente || {}) }
  const setCli = (k, v) => updateCart({ cliente: { ...cli, [k]: v } })
  const conflict = cart?.jetId && cart?.data ? rangeConflict(cart.jetId, cart.data, cart.diarias) : null

  useEffect(() => { if (cart?.cupom && cart.cupom.length >= 4) { const t = setTimeout(() => checkCouponRemote(cart.cupom, cart.jetId, c.base + c.adicionais), 400); return () => clearTimeout(t) } }, [cart?.cupom, cart?.jetId, cart?.diarias])

  // Recuperação de reservas abandonadas (local)
  useEffect(() => {
    if (!cart?.jetId || done) return
    setDB((d) => ({ abandoned: [{ startedAt: cart.startedAt, jetId: cart.jetId, etapa: STEPS[step], nome: cli.nome || '', telefone: cli.telefone || '', email: cli.email || '', total: c.total, atualizado: new Date().toISOString() }, ...d.abandoned.filter((a) => a.startedAt !== cart.startedAt)].slice(0, 100) }))
  }, [step, cart?.jetId, cli.telefone, cli.email])

  if (done) {
    return (
      <>
        <PageHead eyebrow="Reserva criada" title={`Reserva nº ${done.id}`} text="Sua reserva foi registrada e a mensagem foi preparada no WhatsApp. A reserva é confirmada após o pagamento da entrada." />
        <section className="section" style={{ paddingTop: 40 }}><div className="container" style={{ maxWidth: 720 }}>
          <div className="card stack" style={{ textAlign: 'center' }}>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Reserva registrada</span><div><Badge status={done.status} /></div>
            <h2 style={{ margin: 0 }}>{done.id}</h2>
            <div className="line"><span>Sinal ({done.entradaPct}%) via {PAGAMENTO[done.formaPagamento]}</span><strong>{brl(done.entrada)}</strong></div>
            <div className="line"><span>Restante</span><strong>{brl(done.restante)}</strong></div>
            {done.formaPagamento === 'pix' && <p className="small">{s.pixChave ? <>Chave Pix: <strong>{s.pixChave}</strong> — envie o comprovante no WhatsApp.</> : 'A chave Pix será enviada pela equipe no WhatsApp.'}</p>}
            {done.formaPagamento === 'cartao' && (s.cartaoLink ? <a className="btn btn-primary" href={s.cartaoLink} target="_blank" rel="noreferrer">Pagar sinal no cartão</a> : <p className="small">O link de pagamento no cartão será enviado pela equipe no WhatsApp.</p>)}
            <a className="btn btn-wa" href={done.link} target="_blank" rel="noreferrer"><WaIcon size={18} /> Abrir WhatsApp novamente</a>
            <div className="flex wrap" style={{ justifyContent: 'center' }}><Link to="/cliente/reservas" className="btn btn-ghost">Ver na área do cliente</Link><Link to="/jet-skis" className="btn btn-ghost">Nova reserva</Link></div>
          </div>
        </div></section>
      </>
    )
  }

  if (!cart?.jetId || !c.jet) {
    return (
      <>
        <PageHead eyebrow="Minha Reserva" title="Sua reserva está vazia" text="Escolha um Jet Ski da nossa frota para começar." />
        <section className="section" style={{ paddingTop: 40 }}><div className="container"><Link to="/jet-skis" className="btn btn-primary">Conhecer a frota</Link></div></section>
      </>
    )
  }

  const canGo = (st) => {
    if (st >= 2 && (!cart.data || cart.data < today() || conflict)) return 1
    if (st >= 4 && Object.keys(validateClient(cli)).length) return 3
    return st
  }
  const go = (st) => {
    const ok = canGo(st)
    if (ok !== st) {
      if (ok === 1) toast(conflict ? 'Período indisponível para este Jet Ski' : 'Escolha a data de início')
      if (ok === 3) setErr(validateClient(cli))
      setStep(ok); return
    }
    setErr({}); setStep(st); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finalize = async () => {
    const e = validateClient(cli)
    if (Object.keys(e).length) { setErr(e); setStep(3); return }
    if (rangeConflict(cart.jetId, cart.data, cart.diarias)) { toast('Esse período acabou de ficar indisponível. Escolha outra data.'); setStep(1); return }
    const win = window.open('', '_blank') // abre já no clique (evita bloqueio de pop-up)
    setBusy(true)
    let r, client
    const payload = { jetId: cart.jetId, data: cart.data, diarias: cart.diarias, pessoas: cart.pessoas, localId: cart.localId, servicos: cart.servicos, experienciaId: cart.experienciaId, cupom: cart.cupom, formaPagamento: cart.formaPagamento, obs: cli.obs || '', cliente: cli }
    if (db.remote) {
      try {
        const j = await submitReservationRemote(payload)
        r = j.reservation; client = { ...cli, ...j.client }
      } catch (ex) {
        setBusy(false); win && win.close()
        toast(ex.message || 'Não foi possível concluir. Tente novamente.')
        if (ex.status === 409) { setStep(1); import('../store').then((m) => m.loadRemote()) }
        return
      }
    } else {
      client = { id: 'c' + Date.now().toString(36), nome: cli.nome.trim(), email: cli.email.trim(), telefone: cli.telefone, cpf: cli.cpf }
      r = { id: genCode(), clientId: client.id, jetId: cart.jetId, data: cart.data, diarias: cart.diarias, dataFim: c.dataFim, pessoas: cart.pessoas, localId: cart.localId, servicos: cart.servicos, experienciaId: cart.experienciaId, subtotal: c.base, adicionais: c.adicionais, desconto: c.desconto, taxas: c.taxas, caucao: c.caucao, total: c.total, entrada: c.entrada, restante: c.restante, entradaPct: c.entradaPct, formaPagamento: cart.formaPagamento, cupom: c.coupon?.codigo || '', status: 'aguardando_atendimento', pagamento: 'pendente', obs: cli.obs || '', createdAt: new Date().toISOString() }
      notify('reserva', `Nova reserva ${r.id} — ${client.nome} — ${brl(r.total)}`)
    }
    const localClient = { pontos: 0, status: 'ativo', createdAt: today(), refCode: 'AMIGO-' + Math.random().toString(36).slice(2, 7).toUpperCase(), ...db.clients.find((x) => x.email?.toLowerCase() === client.email.toLowerCase()), ...client, cpf: undefined }
    setDB((d) => ({
      clients: [...d.clients.filter((x) => x.id !== localClient.id && x.email?.toLowerCase() !== localClient.email.toLowerCase()), localClient],
      reservations: [...d.reservations.filter((x) => x.id !== r.id), r],
      abandoned: d.abandoned.filter((a) => a.startedAt !== cart.startedAt),
      session: { ...d.session, clientId: d.session.clientId || localClient.id },
    }))
    const link = waLink(whatsNumber(), buildWhatsMessage(r, client))
    if (win) win.location.href = link; else window.open(link, '_blank')
    clearCart(); setBusy(false)
    setDone({ ...r, link })
  }

  return (
    <>
      <PageHead eyebrow="Minha Reserva" title={<>Finalize sua <em>experiência</em></>} />
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="steps" role="tablist">{STEPS.map((x, i) => <button key={x} role="tab" aria-selected={step === i} className={'step ' + (step === i ? 'on' : step > i ? 'done' : '')} onClick={() => go(i)}><b>{String(i + 1).padStart(2, '0')}</b>{x}</button>)}</div>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24 }} id="mr-grid">
            <div className="card">
              {step === 0 && <div className="stack"><h3>1. Jet Ski escolhido</h3>
                <div style={{ overflow: 'hidden', aspectRatio: '4/3', maxWidth: 420 }}><JetPhoto jet={c.jet} /></div>
                <h3>{c.jet.marca} {c.jet.modelo}</h3><p className="small">{c.jet.descricao}</p>
                <Field label="Trocar Jet Ski" id="mr-j"><select id="mr-j" className="input" value={cart.jetId} onChange={(e) => { const j = db.jetskis.find((x) => x.id === e.target.value); updateCart({ jetId: j.id, localId: j.localId }) }}>{db.jetskis.filter((j) => !['manutencao', 'indisponivel'].includes(j.status)).map((j) => <option key={j.id} value={j.id}>{j.marca} {j.modelo} — {brl(j.precoDiaria)}/diária</option>)}</select></Field>
                {Number(c.jet.capacidade) > 1 && <Field label="Pessoas" id="mr-p"><select id="mr-p" className="input" value={cart.pessoas} onChange={(e) => updateCart({ pessoas: +e.target.value })}>{Array.from({ length: Number(c.jet.capacidade) }, (_, i) => <option key={i}>{i + 1}</option>)}</select></Field>}
                <button className="btn btn-primary" onClick={() => go(1)}>Continuar</button></div>}
              {step === 1 && <div className="stack"><h3>2. Data de início e diárias</h3>
                <Calendar jetId={cart.jetId} value={cart.data} onChange={(data) => updateCart({ data, diarias: Math.min(cart.diarias, Math.max(1, maxDiarias(cart.jetId, data))) })} />
                <h4>Quantidade de diárias</h4>
                <DiariasPicker jetId={cart.jetId} data={cart.data} value={cart.diarias} onChange={(diarias) => updateCart({ diarias })} />
                {conflict && <p className="err-msg">Parte desse período já está reservada ou bloqueada. Escolha outra data ou menos diárias.</p>}
                <p className="small muted">Locação somente por diária (mínimo 1). {s.horarioRetirada ? `Retirada: ${s.horarioRetirada}. ` : ''}{s.horarioDevolucao ? `Devolução: ${s.horarioDevolucao}.` : ''}</p>
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(0)}>Voltar</button><button className="btn btn-primary" onClick={() => go(2)}>Continuar</button></div></div>}
              {step === 2 && <div className="stack"><h3>3. Experiência e adicionais</h3>
                <div className="grid g2" style={{ gap: 10 }}>{db.experiences.filter((e) => e.ativo).map((e) => <button key={e.id} className="card" style={{ textAlign: 'left', padding: 14, cursor: 'pointer', borderColor: cart.experienciaId === e.id ? 'var(--primary)' : undefined }} onClick={() => updateCart({ experienciaId: e.id })}><div><strong>{e.nome}</strong></div><small className="muted">{e.descricao}</small><div style={{ fontWeight: 700 }}>{e.preco ? '+ ' + brl(e.preco) : 'Incluso'}</div></button>)}</div>
                {db.services.some((x) => x.ativo) && <><h4>Serviços adicionais</h4>
                {db.services.filter((x) => x.ativo).map((x) => <label key={x.id} className="flex between card" style={{ padding: 12, cursor: 'pointer' }}><span>{x.nome} <small className="muted">— {x.descricao}</small></span><span className="flex"><strong>{brl(x.preco)}</strong><input type="checkbox" checked={cart.servicos.includes(x.id)} onChange={() => updateCart({ servicos: cart.servicos.includes(x.id) ? cart.servicos.filter((y) => y !== x.id) : [...cart.servicos, x.id] })} /></span></label>)}</>}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(1)}>Voltar</button><button className="btn btn-primary" onClick={() => go(3)}>Continuar</button></div></div>}
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
                </div>
                <Field label="Observações" id="f-o"><textarea id="f-o" rows={3} className="input" value={cli.obs || ''} onChange={(e) => setCli('obs', e.target.value)} /></Field>
                <p className="small muted">{s.documentos ? `Documentos necessários: ${s.documentos}. ` : ''}Idade mínima: {s.idadeMinima} anos.</p>
                {s.exigeHabilitacao && <><label className="flex small" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={!!cli.habilitacao} onChange={(e) => setCli('habilitacao', e.target.checked)} style={{ marginTop: 4 }} /> <span>Estou ciente: {s.textoHabilitacao}</span></label>{err.habilitacao && <span className="err-msg">{err.habilitacao}</span>}</>}
                <label className="flex small"><input type="checkbox" checked={!!cli.aceite} onChange={(e) => setCli('aceite', e.target.checked)} /> Li e aceito os termos de locação e a política de privacidade (LGPD).</label>{err.aceite && <span className="err-msg">{err.aceite}</span>}
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(2)}>Voltar</button><button className="btn btn-primary" onClick={() => go(4)}>Revisar</button></div></div>}
              {step === 4 && <div className="stack"><h3>5. Resumo e pagamento</h3>
                {[['Jet Ski', `${c.jet.marca} ${c.jet.modelo}`], ['Início', `${weekday(cart.data)}, ${fmtDate(cart.data)}`], ['Diárias', cart.diarias], ['Término', `${weekday(c.dataFim)}, ${fmtDate(c.dataFim)}`], ['Local', db.locations.find((l) => l.id === cart.localId)?.nome], ['Experiência', c.exp?.nome], ['Titular', cli.nome], ['WhatsApp', cli.telefone]].map(([k, v]) => <div key={k} className="line"><span>{k}</span><strong>{v}</strong></div>)}
                <h4 style={{ marginTop: 12 }}>Sinal de {c.entradaPct}% para confirmar: {brl(c.entrada)}</h4>
                <div className="grid g2" style={{ gap: 10 }}>{[['pix', 'Pix', 'Chave enviada após a reserva'], ['cartao', 'Cartão', 'Link de pagamento seguro']].map(([k, l, d]) => <button key={k} className="card" style={{ textAlign: 'left', padding: 14, cursor: 'pointer', borderColor: cart.formaPagamento === k ? 'var(--primary)' : undefined }} onClick={() => updateCart({ formaPagamento: k })} aria-pressed={cart.formaPagamento === k}><strong>{l}</strong><div className="small muted">{d}</div></button>)}</div>
                <p className="small muted">O restante ({brl(c.restante)}) é pago conforme combinado com a equipe. {s.cancelamento ? 'Cancelamento: ' + s.cancelamento : ''}</p>
                <div className="flex"><button className="btn btn-ghost" onClick={() => go(3)}>Editar dados</button><button className="btn btn-primary" onClick={() => go(5)}>Tudo certo</button></div></div>}
              {step === 5 && <div className="stack" style={{ textAlign: 'center' }}><h3>6. Finalizar pelo WhatsApp</h3>
                <p>Ao confirmar, sua reserva recebe um número único (LJ-XXXXXX), é registrada no sistema, a equipe é avisada por e-mail e o WhatsApp abre com a mensagem pronta.</p>
                <p className="small">A reserva é confirmada após o pagamento da entrada de <strong>{brl(c.entrada)}</strong> via <strong>{PAGAMENTO[cart.formaPagamento]}</strong>.</p>
                <p className="small muted">Por segurança, CPF e endereço não são enviados no WhatsApp.</p>
                <button className="btn btn-wa btn-block" onClick={finalize} disabled={busy}><WaIcon size={20} /> {busy ? 'Registrando reserva...' : 'Finalizar Reserva pelo WhatsApp'}</button>
                <button className="btn btn-ghost" onClick={() => go(4)}>Voltar ao resumo</button></div>}
            </div>
            <aside>
              <div className="card" style={{ position: 'sticky', top: 96 }}>
                <span className="eyebrow">Minha Reserva</span>
                <div className="flex" style={{ alignItems: 'flex-start' }}><div style={{ width: 96, overflow: 'hidden', aspectRatio: '1/1', flexShrink: 0 }}><JetPhoto jet={c.jet} /></div><div><strong>{c.jet.marca} {c.jet.modelo}</strong><div className="small muted">{cart.data ? `${fmtDate(cart.data)} — ${fmtDate(c.dataFim)}` : 'Data a definir'} · {diariasLabel(cart.diarias)}</div></div></div>
                <div className="divider" />
                <div className="line"><span>{diariasLabel(cart.diarias)} × {brl(c.jet.precoDiaria)}</span><strong>{brl(c.base)}</strong></div>
                {c.economia > 0 && <div className="line"><span className="small">Preço normal {brl(c.original)}</span><strong className="small" style={{ color: 'var(--success)' }}>economia de {brl(c.economia)}</strong></div>}
                {c.itens.map((i) => <div key={i.nome} className="line"><span>{i.nome}</span><strong>{brl(i.preco)}</strong></div>)}
                <div className="flex" style={{ margin: '8px 0' }}><input className="input" placeholder="Cupom de desconto" value={cart.cupom} onChange={(e) => updateCart({ cupom: e.target.value.toUpperCase().trim() })} aria-label="Cupom" /></div>
                {cart.cupom && <small style={{ color: c.coupon ? 'var(--success)' : 'var(--danger)' }}>{c.coupon ? `Cupom ${c.coupon.codigo} aplicado` : 'Cupom inválido ou não aplicável'}</small>}
                {c.desconto > 0 && <div className="line"><span>Desconto</span><strong style={{ color: 'var(--success)' }}>-{brl(c.desconto)}</strong></div>}
                {c.taxas > 0 && <div className="line"><span>Taxas</span><strong>{brl(c.taxas)}</strong></div>}
                {c.caucao > 0 && <div className="line"><span>Caução (devolvível)</span><strong>{brl(c.caucao)}</strong></div>}
                <div className="divider" />
                <div className="total"><span>Total</span><span>{brl(c.total)}</span></div>
                <div className="line" style={{ marginTop: 6 }}><span>Sinal ({c.entradaPct}%)</span><strong style={{ color: 'var(--primary)' }}>{brl(c.entrada)}</strong></div>
                <div className="line"><span>Restante</span><strong>{brl(c.restante)}</strong></div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 900px){ #mr-grid{ grid-template-columns: 1fr !important } }`}</style>
    </>
  )
}
