import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDB, brl, updateCart, emptyCart, whatsNumber, waLink, getDB, today, rangeConflict, maxDiarias, rangeEnd, fmtDate, diariasLabel, SALE_STATUS } from '../store'
import { calcPrice } from '../shared'
import { DiariasPicker } from './MinhaReserva'
import { JetArt, JetPhoto, JetBadge, Badge, Reveal, Field, toast, WaIcon } from '../components/ui'
import { PageHead, openCart } from '../components/Layout'
import Calendar from '../components/Calendar'
import { SITE, PH } from '../config'

export function JetCard({ jet, i = 0 }) {
  const nav = useNavigate()
  const db = useDB()
  const loc = db.locations.find((l) => l.id === jet.localId)
  const reserve = () => { updateCart({ ...emptyCart(), ...(db.cart?.data ? { data: db.cart.data, diarias: db.cart.diarias } : {}), jetId: jet.id, localId: jet.localId }); toast('🌊 Jet Ski adicionado à Minha Reserva'); nav('/jet-skis/' + jet.id + '#reservar') }
  return (
    <Reveal delay={i * 80} className="card card-hover jet-card">
      <Link to={'/jet-skis/' + jet.id} className="jet-media" style={{ aspectRatio: '1/1' }} aria-label={`Ver ${jet.marca} ${jet.modelo}`}><JetPhoto jet={jet} /><JetBadge status={jet.status} />{jet.precoOriginal > jet.precoDiaria && <span className="badge tone-warning" style={{ left: 'auto', right: 14, background: 'rgba(3,14,28,.75)' }}>-{Math.round((1 - jet.precoDiaria / jet.precoOriginal) * 100)}% promoção</span>}</Link>
      <div className="jet-body">
        <div><small className="muted">{jet.marca} · {jet.categoria} · {jet.ano}</small><h3 style={{ margin: '2px 0 0' }}>{jet.modelo}</h3><small className="muted">📍 {loc?.nome}</small></div>
        <div className="specs"><div className="spec"><span>Ano</span><strong>{jet.ano}</strong></div><div className="spec"><span>Potência</span><strong>{jet.potencia || '—'}</strong></div><div className="spec"><span>Pessoas</span><strong>{jet.capacidade || 'A confirmar'}</strong></div></div>
        <div style={{ marginTop: 'auto' }}>{jet.precoOriginal > jet.precoDiaria && <small className="muted" style={{ textDecoration: 'line-through' }}>de {brl(jet.precoOriginal)}</small>}<div className="price">{brl(jet.precoDiaria)}<small> /diária</small></div></div>
        <div className="grid g2" style={{ gap: 8 }}>
          <Link to={'/jet-skis/' + jet.id} className="btn btn-ghost btn-sm">Ver detalhes</Link>
          <button className="btn btn-primary btn-sm" onClick={reserve} disabled={jet.status === 'manutencao' || jet.status === 'indisponivel'}>Reservar</button>
        </div>
      </div>
    </Reveal>
  )
}

function Waves() {
  const path = 'M0 80 Q90 40 180 80 T360 80 T540 80 T720 80 T900 80 T1080 80 T1260 80 T1440 80 V200 H0Z'
  return (
    <div className="hero-waves" aria-hidden="true">
      <svg className="wave1" viewBox="0 0 1440 200" preserveAspectRatio="none"><path d={path} fill="#0A6E96" /></svg>
      <svg className="wave2" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: '80%' }}><path d={path} fill="#064A73" /></svg>
      <svg className="wave3" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: '55%' }}><path d={path} fill="#030E1C" /></svg>
    </div>
  )
}

export function Home() {
  const db = useDB()
  const nav = useNavigate()
  const [q, setQ] = useState({ data: '', diarias: 1, jetId: '' })
  const jets = db.jetskis.slice(0, 3)
  const exps = db.experiences.filter((e) => e.ativo).slice(0, 6)
  const search = () => { if (q.jetId) { updateCart({ ...emptyCart(), data: q.data, diarias: q.diarias, jetId: q.jetId, localId: db.jetskis.find((j) => j.id === q.jetId)?.localId }); nav('/jet-skis/' + q.jetId + '#reservar') } else { updateCart({ ...emptyCart(), data: q.data, diarias: q.diarias, jetId: null }); nav('/jet-skis') } }
  const promos = db.promos || db.coupons.filter((c) => c.ativo && c.imagem)
  return (
    <>
      <section className="hero">
        <div className="hero-sun" aria-hidden="true" />
        <Waves />
        <div className="hero-jet" aria-hidden="true"><JetArt hue={198} scene={false} /></div>
        <div className="container">
          <div className="hero-content">
            <span className="eyebrow">Locação de Jet Skis · Goiás — GO</span>
            <h1>Viva a experiência de pilotar um <span className="grad-text">Jet Ski em Goiás.</span></h1>
            <p className="lead">Escolha seu Jet Ski, reserve seu horário e aproveite momentos inesquecíveis na água.</p>
            <div className="flex wrap" style={{ marginTop: 28 }}>
              <Link to="/jet-skis" className="btn btn-primary">Reservar agora →</Link>
              <a href="#frota" className="btn btn-ghost">Ver Jet Skis</a>
            </div>
            <div className="hero-stats"><div><strong>Diárias</strong><span>a partir de {brl(Math.min(...db.jetskis.map((j) => j.precoDiaria || Infinity)))}</span></div><div><strong>Reserva online</strong><span>{db.settings.entradaPct}% de entrada · Pix ou cartão</span></div><div><strong>Goiás — GO</strong><span>de norte a sul do estado</span></div></div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="booking-bar" role="search" aria-label="Buscar disponibilidade">
          <Field label="📅 Data" id="bb-d"><input id="bb-d" type="date" className="input" min={today()} value={q.data} onChange={(e) => setQ({ ...q, data: e.target.value })} /></Field>
          <Field label="🗓️ Diárias" id="bb-du"><select id="bb-du" className="input" value={q.diarias} onChange={(e) => setQ({ ...q, diarias: +e.target.value })}>{Array.from({ length: Number(db.settings.diariasMax) || 15 }, (_, i) => <option key={i} value={i + 1}>{diariasLabel(i + 1)}</option>)}</select></Field>
          <Field label="🌊 Jet Ski" id="bb-j"><select id="bb-j" className="input" value={q.jetId} onChange={(e) => setQ({ ...q, jetId: e.target.value })}><option value="">Todos os modelos</option>{db.jetskis.map((j) => <option key={j.id} value={j.id}>{j.modelo} — {brl(j.precoDiaria)}/diária</option>)}</select></Field>
          <Field label="💳 Entrada" id="bb-e"><div className="input" style={{ color: 'var(--text-secondary)' }}>{db.settings.entradaPct}% via Pix ou cartão</div></Field>
          <button className="btn btn-primary" onClick={search}>Buscar Jet Skis</button>
        </div>
      </div>

      <section className="section" id="frota">
        <div className="container">
          <div className="flex between wrap" style={{ marginBottom: 32 }}>
            <Reveal><span className="eyebrow">Nossa frota</span><h2 style={{ margin: 0 }}>Escolha seu Jet Ski</h2></Reveal>
            <Link to="/jet-skis" className="btn btn-ghost">Ver todos →</Link>
          </div>
          <div className={"grid " + (jets.length === 2 ? "g2" : "g3")} style={jets.length === 2 ? { maxWidth: 900 } : null}>{jets.map((j, i) => <JetCard key={j.id} jet={j} i={i} />)}</div>
        </div>
      </section>

      {promos.length > 0 && <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal style={{ marginBottom: 24 }}><span className="eyebrow">Promoções</span><h2 style={{ margin: 0 }}>Cupons de desconto</h2><p style={{ marginTop: 8 }}>Peça seu cupom no WhatsApp ou Instagram {db.settings.instagram} e use em Minha Reserva. Validade: {promos[0].validadeDias || 30} dias após o recebimento.</p></Reveal>
          <div className="grid g2">{promos.map((c, i) => <Reveal key={c.id} delay={i * 80}><a href={waLink(whatsNumber(), `Olá! Quero receber o cupom de ${c.valor}% de desconto da Loca Jett.`)} target="_blank" rel="noreferrer" className="card card-hover" style={{ display: 'block', padding: 0, overflow: 'hidden' }}><img src={c.imagem} alt={`Cupom de ${c.valor}% de desconto`} loading="lazy" style={{ width: '100%' }} /></a></Reveal>)}</div>
        </div>
      </section>}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="card flex wrap between" style={{ padding: 'clamp(24px,4vw,40px)', gap: 20 }}>
            <div><span className="eyebrow">Venda de Jet Skis</span><h3 style={{ margin: 0 }}>Quer comprar um Jet Ski?</h3><p style={{ margin: '8px 0 0' }}>Veja os modelos à venda e fale direto com a Loca Jett.</p></div>
            <Link to="/venda" className="btn btn-primary">Ver Jet Skis à venda →</Link>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--background-secondary)' }}>
        <div className="container">
          <Reveal style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}><span className="eyebrow">Experiências</span><h2>Mais que uma locação: uma experiência</h2><p>Do primeiro passeio à surpresa perfeita, escolha o momento ideal na água.</p></Reveal>
          <div className="grid g3">{exps.map((e, i) => (
            <Reveal key={e.id} delay={i * 60} className="card card-hover"><div style={{ fontSize: 34 }}>{e.icon}</div><h3 style={{ marginTop: 12 }}>{e.nome}</h3><p>{e.descricao}</p><Link to="/experiencias" className="small" style={{ color: 'var(--primary)', fontWeight: 600 }}>Saiba mais →</Link></Reveal>
          ))}</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal style={{ textAlign: 'center', marginBottom: 48 }}><span className="eyebrow">Como funciona</span><h2>Reserve em 4 passos</h2></Reveal>
          <div className="grid g4">{[['🌊', 'Escolha o Jet Ski', 'Compare modelos, capacidade e preços.'], ['📅', 'Data e diárias', 'Veja só os dias realmente livres.'], ['✨', 'Personalize', 'Adicione fotos, instrutor, VIP e mais.'], ['💬', 'Entrada e WhatsApp', 'Pague a entrada (Pix ou cartão) e receba a confirmação.']].map(([ic, t, d], i) => (
            <Reveal key={t} delay={i * 80} className="card"><div className="flex"><span style={{ fontSize: 28 }}>{ic}</span><span className="badge tone-accent">Passo {i + 1}</span></div><h4 style={{ marginTop: 14 }}>{t}</h4><p className="small">{d}</p></Reveal>
          ))}</div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="card" style={{ padding: 'clamp(28px,5vw,56px)', background: 'radial-gradient(600px 300px at 90% 10%, rgba(255,140,60,.35), transparent 60%), linear-gradient(135deg, #0A3A66, #052040)', textAlign: 'center' }}>
            <span className="eyebrow">Loca Jett Oficial</span>
            <h2>Sua próxima experiência começa na água.</h2>
            <p style={{ maxWidth: 520, margin: '0 auto 24px' }}>Garanta seu horário agora e finalize em segundos pelo WhatsApp.</p>
            <div className="flex wrap" style={{ justifyContent: 'center' }}><Link to="/jet-skis" className="btn btn-sunset">Reservar agora</Link><a className="btn btn-wa" href={waLink(whatsNumber(), 'Olá! Quero reservar um Jet Ski com a Loca Jett Oficial.')} target="_blank" rel="noreferrer"><WaIcon size={18} /> Falar no WhatsApp</a></div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export function JetSkis() {
  const db = useDB()
  const params = new URLSearchParams(location.search)
  const [f, setF] = useState({ cat: '', local: params.get('local') || '', cap: 0, ord: 'preco' })
  const cats = [...new Set(db.jetskis.map((j) => j.categoria))]
  const list = db.jetskis.filter((j) => (!f.cat || j.categoria === f.cat) && (!f.local || j.localId === f.local) && j.capacidade >= f.cap)
    .sort((a, b) => (f.ord === 'preco' ? a.precoDiaria - b.precoDiaria : b.precoDiaria - a.precoDiaria))
  return (
    <>
      <PageHead eyebrow="Catálogo" title="Jet Skis disponíveis" text="Escolha o modelo ideal para o seu passeio. Todos com coletes e orientação de segurança." />
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="flex wrap" style={{ marginBottom: 28 }}>
            <button className={'chip ' + (!f.cat ? 'on' : '')} onClick={() => setF({ ...f, cat: '' })}>Todos</button>
            {cats.map((c) => <button key={c} className={'chip ' + (f.cat === c ? 'on' : '')} onClick={() => setF({ ...f, cat: c })}>{c}</button>)}
            <select className="input" style={{ width: 'auto' }} value={f.local} onChange={(e) => setF({ ...f, local: e.target.value })} aria-label="Filtrar por local"><option value="">Todos os locais</option>{db.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
            <select className="input" style={{ width: 'auto' }} value={f.cap} onChange={(e) => setF({ ...f, cap: +e.target.value })} aria-label="Capacidade"><option value={0}>Qualquer capacidade</option><option value={2}>2+ pessoas</option><option value={3}>3 pessoas</option></select>
            <select className="input" style={{ width: 'auto' }} value={f.ord} onChange={(e) => setF({ ...f, ord: e.target.value })} aria-label="Ordenar"><option value="preco">Menor preço</option><option value="-preco">Maior preço</option></select>
          </div>
          {list.length ? <div className="grid g3">{list.map((j, i) => <JetCard key={j.id} jet={j} i={i} />)}</div> : <div className="empty card">Nenhum Jet Ski encontrado com esses filtros.</div>}
        </div>
      </section>
    </>
  )
}

export function JetSkiDetail() {
  const { id } = useParams()
  const db = useDB()
  const nav = useNavigate()
  const s = db.settings
  const jet = db.jetskis.find((j) => j.id === id)
  const sameCart = db.cart?.jetId === id ? db.cart : null
  const [r, setR] = useState(() => ({ data: sameCart?.data || db.cart?.data || '', diarias: sameCart?.diarias || db.cart?.diarias || 1, servicos: sameCart?.servicos || [] }))
  const [view, setView] = useState(0)
  if (!jet) return <PageHead eyebrow="Ops" title="Jet Ski não encontrado" />
  const loc = db.locations.find((l) => l.id === jet.localId)
  const fotos = jet.fotos?.length ? jet.fotos : []
  const conflict = r.data ? rangeConflict(jet.id, r.data, r.diarias) : null
  const p = calcPrice({ jet, diarias: r.diarias, services: db.services.filter((x) => r.servicos.includes(x.id)), settings: s })
  const toggle = (sid) => setR({ ...r, servicos: r.servicos.includes(sid) ? r.servicos.filter((x) => x !== sid) : [...r.servicos, sid] })
  const add = (go) => {
    if (r.data && conflict) return toast('Período indisponível — escolha outra data')
    updateCart({ ...(sameCart || emptyCart()), jetId: jet.id, localId: jet.localId, ...r })
    toast('🛒 Adicionado à Minha Reserva')
    go ? nav('/minha-reserva') : openCart()
  }
  const disabled = ['manutencao', 'indisponivel'].includes(jet.status)
  return (
    <>
      <section className="page-head" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Link to="/jet-skis" className="small muted">← Voltar ao catálogo</Link>
          <div className="grid g2" style={{ marginTop: 20, alignItems: 'start' }}>
            <div>
              <div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1/1' }}><JetPhoto jet={jet} i={view} fit="contain" /></div>
              {fotos.length > 1 && <div className="grid g4" style={{ gap: 8, marginTop: 8 }}>{fotos.map((f, v) => <button key={v} onClick={() => setView(v)} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', borderColor: view === v ? 'var(--primary)' : undefined }} aria-label={`Foto ${v + 1}`}><img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
            </div>
            <div>
              <JetBadge status={jet.status} />
              <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginTop: 12 }}>{jet.marca} {jet.modelo}</h1>
              <p>{jet.descricao}</p>
              <div className="flex wrap" style={{ gap: 20, margin: '16px 0', alignItems: 'flex-end' }}>
                <div>{jet.precoOriginal > jet.precoDiaria && <small className="muted" style={{ textDecoration: 'line-through' }}>de {brl(jet.precoOriginal)}</small>}<div className="price" style={{ fontSize: '2.2rem' }}>{brl(jet.precoDiaria)}</div><small className="muted">por diária · mínimo 1 diária</small></div>
                {jet.precoOriginal > jet.precoDiaria && <span className="badge tone-warning">Economize {brl(jet.precoOriginal - jet.precoDiaria)} por diária</span>}
              </div>
              <div className="specs" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {[['Ano', jet.ano], ['Categoria', jet.categoria], ['Potência', jet.potencia || '—'], ['Capacidade', jet.capacidade ? jet.capacidade + ' pessoas' : 'A confirmar'], ['Cor', jet.cor || '—'], ['Combustível', 'Não incluso'], ['Idade mínima', s.idadeMinima + ' anos'], ['Local', loc?.nome?.split(' — ')[0]], ['Entrada', s.entradaPct + '% na reserva']].map(([k, v]) => <div className="spec" key={k}><span>{k}</span><strong>{v}</strong></div>)}
              </div>
              <a href="#reservar" className="btn btn-primary" style={{ marginTop: 20 }}>Reservar este Jet Ski ↓</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container grid" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 28 }} id="reservar">
          <div className="stack">
            <div className="card"><h3>1. Escolha a data de início</h3>{disabled ? <p>Este Jet Ski está indisponível no momento. Escolha outro modelo.</p> : <Calendar jetId={jet.id} value={r.data} onChange={(data) => setR({ ...r, data, diarias: Math.min(r.diarias, Math.max(1, maxDiarias(jet.id, data))) })} />}</div>
            <div className="card"><h3>2. Quantidade de diárias</h3>
              <DiariasPicker jetId={jet.id} data={r.data} value={r.diarias} onChange={(diarias) => setR({ ...r, diarias })} />
              {conflict && <p className="err-msg" style={{ marginTop: 8 }}>Parte desse período já está reservada ou bloqueada.</p>}
              <p className="small muted" style={{ marginTop: 10 }}>Locação somente por diária. {s.horarioRetirada ? `Retirada: ${s.horarioRetirada}. ` : ''}{s.horarioDevolucao ? `Devolução: ${s.horarioDevolucao}.` : ''}</p>
            </div>
            {db.services.some((x) => x.ativo) && <div className="card"><h3>3. Serviços adicionais</h3>
              <div className="grid g2" style={{ gap: 10 }}>{db.services.filter((x) => x.ativo).map((x) => (
                <label key={x.id} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: r.servicos.includes(x.id) ? 'var(--primary)' : undefined }}>
                  <div className="flex between"><span>{x.icon} <strong>{x.nome}</strong></span><input type="checkbox" checked={r.servicos.includes(x.id)} onChange={() => toggle(x.id)} /></div>
                  <small className="muted">{x.descricao}</small><div style={{ fontWeight: 700, marginTop: 4 }}>{brl(x.preco)}</div>
                </label>
              ))}</div>
            </div>}
            <div className="grid g2">
              <div className="card"><h4>Características</h4><ul className="small" style={{ color: 'var(--text-secondary)', paddingLeft: 18 }}>{(jet.caracteristicas || []).map((c) => <li key={c}>{c}</li>)}</ul></div>
              <div className="card"><h4>Regras e requisitos</h4><ul className="small" style={{ color: 'var(--text-secondary)', paddingLeft: 18 }}>{(jet.regras || []).map((c) => <li key={c}>{c}</li>)}{s.exigeHabilitacao && <li>{s.textoHabilitacao}</li>}<li>Documentos: {s.documentos || '[A DEFINIR]'}</li></ul></div>
            </div>
          </div>
          <aside>
            <div className="card" style={{ position: 'sticky', top: 96 }}>
              <h3>Resumo</h3>
              <div className="line"><span>Início</span><strong>{r.data ? fmtDate(r.data) : '—'}</strong></div>
              <div className="line"><span>Término</span><strong>{r.data ? fmtDate(rangeEnd(r.data, r.diarias)) : '—'}</strong></div>
              <div className="line"><span>Diárias</span><strong>{r.diarias}</strong></div>
              <div className="divider" />
              <div className="line"><span>{diariasLabel(r.diarias)} × {brl(jet.precoDiaria)}</span><strong>{brl(p.base)}</strong></div>
              {p.adicionais > 0 && <div className="line"><span>Adicionais</span><strong>{brl(p.adicionais)}</strong></div>}
              {p.economia > 0 && <div className="line"><span className="small">Você economiza</span><strong className="small" style={{ color: 'var(--success)' }}>{brl(p.economia)}</strong></div>}
              <div className="total" style={{ marginTop: 8 }}><span>Total</span><span>{brl(p.total)}</span></div>
              <div className="line"><span>Entrada ({p.entradaPct}%) via Pix ou cartão</span><strong style={{ color: 'var(--primary)' }}>{brl(p.entrada)}</strong></div>
              <div className="stack" style={{ marginTop: 16 }}>
                <button className="btn btn-primary btn-block" disabled={disabled} onClick={() => add(true)}>Continuar reserva →</button>
                <button className="btn btn-ghost btn-block" disabled={disabled} onClick={() => add(false)}>🛒 Adicionar à Minha Reserva</button>
                <a className="btn btn-wa btn-block btn-sm" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski ${jet.marca} ${jet.modelo}. Pode me passar mais informações?`)} target="_blank" rel="noreferrer"><WaIcon size={16} /> Tirar dúvidas no WhatsApp</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <style>{`@media (max-width: 900px){ #reservar{ grid-template-columns: 1fr !important } }`}</style>
    </>
  )
}

export function Experiencias() {
  const db = useDB()
  return (
    <>
      <PageHead eyebrow="Experiências" title="Escolha o seu momento na água" text="Experiências configuráveis pela equipe Loca Jett. Selecione uma e escolha o Jet Ski." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g3">
        {db.experiences.filter((e) => e.ativo).map((e, i) => (
          <Reveal key={e.id} delay={i * 60} className="card card-hover" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '16/9' }}><JetArt hue={(i * 47 + 180) % 360} /></div>
            <div style={{ padding: 22 }}><div style={{ fontSize: 30 }}>{e.icon}</div><h3>{e.nome}</h3><p>{e.descricao}</p>
              <div className="flex between"><strong>{e.preco ? '+ ' + brl(e.preco) : 'Incluso'}</strong><Link to="/jet-skis" className="btn btn-primary btn-sm" onClick={() => updateCart({ ...(getDB().cart || emptyCart()), experienciaId: e.id })}>Escolher</Link></div></div>
          </Reveal>
        ))}
      </div></section>
    </>
  )
}

export function ComoFunciona() {
  const s = useDB().settings
  const steps = [['🌊', 'Escolha o Jet Ski', 'Compare modelos, potência e o valor da diária.'], ['📅', 'Escolha a data', 'O calendário mostra apenas os dias disponíveis — sem conflitos.'], ['🗓️', 'Defina as diárias', `Locação somente por diária (mínimo 1). O total é calculado na hora.`], ['📝', 'Preencha seus dados', `Titular com ${s.idadeMinima} anos ou mais. Dados protegidos (LGPD).`], ['💳', `Pague ${s.entradaPct}% de entrada`, 'Via Pix ou cartão para confirmar a reserva.'], ['💬', 'Finalize pelo WhatsApp', 'Sua reserva recebe um número (LJ-XXXXXX) e a mensagem vai pronta.'], ['🤝', 'Atendimento Loca Jett', 'Nossa equipe confirma e combina retirada e devolução.'], ['🏁', 'Aproveite a água', 'Restante pago conforme combinado.']]
  const ph = (v) => v || '[A DEFINIR]'
  return (
    <>
      <PageHead eyebrow="Como funciona" title="Simples, rápido e seguro" text="Do clique até a água em poucos passos." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g4">
        {steps.map(([ic, t, d], i) => <Reveal key={t} delay={i * 50} className="card"><span className="badge tone-accent">{String(i + 1).padStart(2, '0')}</span><div style={{ fontSize: 30, marginTop: 12 }}>{ic}</div><h4 style={{ marginTop: 8 }}>{t}</h4><p className="small">{d}</p></Reveal>)}
      </div>
      <div className="container grid g2" style={{ marginTop: 48 }}>
        <div className="card"><h3>Requisitos para pilotar</h3><ul style={{ color: 'var(--text-secondary)' }}><li>Idade mínima: {s.idadeMinima} anos</li>{s.exigeHabilitacao && <li>{s.textoHabilitacao}</li>}<li>Documentos: {ph(s.documentos)}</li><li>Segurança: {ph(s.seguranca)}</li></ul></div>
        <div className="card"><h3>Regras da locação</h3><ul style={{ color: 'var(--text-secondary)' }}><li>Somente por diária — mínimo 1 diária</li><li>Entrada de {s.entradaPct}% para confirmar (Pix ou cartão)</li><li>Combustível não incluso</li><li>Retirada: {ph(s.horarioRetirada)} · Devolução: {ph(s.horarioDevolucao)}</li><li>Funcionamento: {ph(s.diasFuncionamento)}</li><li>Cancelamento: {ph(s.cancelamento)}</li><li>Chuva / mau tempo: {ph(s.chuva)}</li></ul></div>
      </div>
      </section>
    </>
  )
}

const REGIONS = [
  { id: 'Norte', d: 'M150 20 L330 30 L360 120 L250 150 L140 120Z', c: 'hsl(198 80% 45%)' },
  { id: 'Oeste', d: 'M40 120 L140 120 L250 150 L230 260 L90 290 L30 210Z', c: 'hsl(210 80% 45%)' },
  { id: 'Centro', d: 'M250 150 L360 120 L400 210 L320 260 L230 260Z', c: 'hsl(190 85% 50%)' },
  { id: 'Leste', d: 'M360 120 L470 140 L480 260 L400 210Z', c: 'hsl(220 75% 50%)' },
  { id: 'Sul', d: 'M90 290 L230 260 L320 260 L400 210 L480 260 L420 360 L180 380Z', c: 'hsl(205 70% 40%)' },
]
export function Locais() {
  const db = useDB()
  const [reg, setReg] = useState('')
  const locs = db.locations.filter((l) => l.ativo && (!reg || l.regiao === reg))
  return (
    <>
      <PageHead eyebrow="Área de atuação" title="Locais em todo o estado de Goiás" text="Selecione uma região do mapa para ver os pontos de embarque. Mapa esquemático." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container grid g2" style={{ alignItems: 'start' }}>
          <div className="card">
            <svg viewBox="0 0 520 400" role="img" aria-label="Mapa esquemático das regiões de Goiás">
              {REGIONS.map((r) => <g key={r.id} className="map-region" onClick={() => setReg(reg === r.id ? '' : r.id)}>
                <path d={r.d} fill={r.c} opacity={!reg || reg === r.id ? 0.9 : 0.25} stroke="#030E1C" strokeWidth="3" />
              </g>)}
              {REGIONS.map((r) => { const pts = r.d.match(/\d+ \d+/g).map((p) => p.split(' ').map(Number)); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; const n = db.locations.filter((l) => l.regiao === r.id && l.ativo).length; return <g key={r.id + 't'} pointerEvents="none"><text x={cx} y={cy} textAnchor="middle" fill="#fff" fontWeight="700" fontSize="15">{r.id}</text>{n > 0 && <text x={cx} y={cy + 18} textAnchor="middle" fill="#FFD9A0" fontSize="12">📍 {n} local(is)</text>}</g> })}
            </svg>
            <div className="flex wrap" style={{ marginTop: 12 }}><button className={'chip ' + (!reg ? 'on' : '')} onClick={() => setReg('')}>Todas</button>{REGIONS.map((r) => <button key={r.id} className={'chip ' + (reg === r.id ? 'on' : '')} onClick={() => setReg(r.id)}>{r.id}</button>)}</div>
          </div>
          <div className="stack">
            {locs.length ? locs.map((l) => {
              const jets = db.jetskis.filter((j) => j.localId === l.id)
              return <div key={l.id} className="card"><span className="badge tone-accent">{l.regiao}</span><h3 style={{ marginTop: 10 }}>{l.nome}</h3><p className="small">{l.descricao}</p><p className="small muted">{jets.filter((j) => j.status === 'disponivel').length} de {jets.length} Jet Skis disponíveis</p><Link to={'/jet-skis?local=' + l.id} className="btn btn-primary btn-sm">Ver Jet Skis deste local</Link></div>
            }) : <div className="card empty">Nenhum local cadastrado nesta região ainda. {PH('CIDADES ATENDIDAS')}</div>}
          </div>
        </div>
      </section>
    </>
  )
}

export function Sobre() {
  return (
    <>
      <PageHead eyebrow="Sobre nós" title="Loca Jett Oficial" text="Locação de Jet Skis e experiências náuticas em todo o estado de Goiás." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g2" style={{ alignItems: 'center' }}>
        <Reveal><h2>Liberdade, velocidade e segurança na água</h2><p>A Loca Jett Oficial nasceu para transformar um dia comum em uma experiência inesquecível. Cuidamos de tudo — do equipamento à orientação — para você só se preocupar em aproveitar.</p><p className="muted">{PH('HISTÓRIA DA EMPRESA')}</p>
          <div className="grid g3" style={{ marginTop: 24 }}>{[['🛟', 'Segurança'], ['⭐', 'Premium'], ['🤝', 'Atendimento']].map(([i, t]) => <div className="card" key={t} style={{ textAlign: 'center', padding: 16 }}><div style={{ fontSize: 26 }}>{i}</div><strong>{t}</strong></div>)}</div></Reveal>
        <Reveal delay={150} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '4/3' }}><JetArt hue={30} /></Reveal>
      </div></section>
    </>
  )
}

export function Contato() {
  const s = useDB().settings
  const [f, setF] = useState({ nome: '', email: '', msg: '' })
  const [err, setErr] = useState({})
  const send = (e) => {
    e.preventDefault()
    const er = {}
    if (f.nome.trim().length < 3) er.nome = 'Informe seu nome'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'E-mail inválido'
    if (f.msg.trim().length < 5) er.msg = 'Escreva sua mensagem'
    setErr(er)
    if (Object.keys(er).length) return
    window.open(waLink(whatsNumber(), `Olá! Sou ${f.nome} (${f.email}).\n\n${f.msg}`), '_blank')
  }
  const ph = (v, c) => v || PH(c)
  return (
    <>
      <PageHead eyebrow="Contato" title="Fale com a Loca Jett" text="Tire dúvidas, peça orçamento para grupos, pacotes sob medida ou informações sobre Jet Skis à venda." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g2" style={{ alignItems: 'start' }}>
        <form className="card stack" onSubmit={send} noValidate>
          <Field label="Nome" id="c-n" error={err.nome}><input id="c-n" className={'input ' + (err.nome ? 'err' : '')} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="E-mail" id="c-e" error={err.email}><input id="c-e" type="email" className={'input ' + (err.email ? 'err' : '')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Mensagem" id="c-m" error={err.msg}><textarea id="c-m" rows={5} className={'input ' + (err.msg ? 'err' : '')} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <button className="btn btn-wa"><WaIcon size={18} /> Enviar pelo WhatsApp</button>
        </form>
        <div className="stack">
          <a className="card flex" style={{ padding: 16 }} href={waLink(whatsNumber(), 'Olá! Vim pelo site da Loca Jett.')} target="_blank" rel="noreferrer"><span style={{ fontSize: 24 }}>💬</span><div><strong>WhatsApp</strong><div className="small muted">{ph(s.telefone, 'WHATSAPP')}</div></div></a>
          <a className="card flex" style={{ padding: 16 }} href={s.instagramUrl || '#'} target="_blank" rel="noreferrer"><span style={{ fontSize: 24 }}>📸</span><div><strong>Instagram</strong><div className="small muted">{ph(s.instagram, 'INSTAGRAM')}</div></div></a>
          {[['📍', 'Endereço', ph(s.endereco, 'ENDEREÇO') + (s.cidade ? ' — ' + s.cidade : '')], ['🕒', 'Retirada / devolução', `${ph(s.horarioRetirada, 'HORÁRIO')} / ${ph(s.horarioDevolucao, 'HORÁRIO')}`], ['📆', 'Dias de funcionamento', ph(s.diasFuncionamento, 'DIAS')]].map(([i, t, v]) => <div key={t} className="card flex" style={{ padding: 16 }}><span style={{ fontSize: 24 }}>{i}</span><div><strong>{t}</strong><div className="small muted">{v}</div></div></div>)}
          {s.mapsUrl && <a className="btn btn-ghost" href={s.mapsUrl} target="_blank" rel="noreferrer">🗺️ Ver no Google Maps</a>}
        </div>
      </div></section>
    </>
  )
}

export function Venda() {
  const db = useDB()
  const list = (db.sales || []).filter((x) => x.status !== 'oculto')
  return (
    <>
      <PageHead eyebrow="Venda de Jet Skis" title="Jet Skis à venda" text="Seminovos e oportunidades selecionadas pela Loca Jett. Fale com a gente no WhatsApp para negociar." />
      <section className="section" style={{ paddingTop: 40 }}><div className="container">
        {list.length ? <div className="grid g3">{list.map((x, i) => (
          <Reveal key={x.id} delay={i * 60} className="card card-hover jet-card">
            <Link to={'/venda/' + x.id} className="jet-media" style={{ aspectRatio: '4/3' }}><JetPhoto jet={x} /><Badge status={x.status || 'disponivel'} map={SALE_STATUS} /></Link>
            <div className="jet-body">
              <div><small className="muted">{x.marca} · {x.ano}</small><h3 style={{ margin: '2px 0 0' }}>{x.modelo}</h3></div>
              <div className="specs"><div className="spec"><span>Ano</span><strong>{x.ano || '—'}</strong></div><div className="spec"><span>Horas</span><strong>{x.horasUso ?? '—'}</strong></div><div className="spec"><span>Estado</span><strong>{x.estado || '—'}</strong></div></div>
              <div className="price" style={{ marginTop: 'auto' }}>{x.preco ? brl(x.preco) : 'Consulte'}</div>
              <div className="grid g2" style={{ gap: 8 }}><Link to={'/venda/' + x.id} className="btn btn-ghost btn-sm">Ver detalhes</Link><a className="btn btn-wa btn-sm" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski à venda: ${x.marca || ''} ${x.modelo} ${x.ano || ''}.`)}>Tenho interesse</a></div>
            </div>
          </Reveal>
        ))}</div> : <div className="card empty"><div style={{ fontSize: 42 }}>🚤</div><p>Em breve novos Jet Skis à venda.<br />Quer comprar ou vender um Jet Ski? Fale com a gente.</p><a className="btn btn-wa" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), 'Olá! Quero informações sobre Jet Skis à venda.')}><WaIcon size={18} /> Falar no WhatsApp</a></div>}
      </div></section>
    </>
  )
}

export function VendaDetalhe() {
  const { id } = useParams()
  const db = useDB()
  const [view, setView] = useState(0)
  const x = (db.sales || []).find((s) => s.id === id)
  if (!x) return <PageHead eyebrow="Ops" title="Anúncio não encontrado" />
  const fotos = x.fotos || []
  return (
    <section className="page-head"><div className="container">
      <Link to="/venda" className="small muted">← Voltar para Jet Skis à venda</Link>
      <div className="grid g2" style={{ marginTop: 20, alignItems: 'start' }}>
        <div><div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '4/3' }}><JetPhoto jet={x} i={view} fit="contain" /></div>
          {fotos.length > 1 && <div className="grid g4" style={{ gap: 8, marginTop: 8 }}>{fotos.map((f, v) => <button key={v} onClick={() => setView(v)} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', borderColor: view === v ? 'var(--primary)' : undefined }} aria-label={`Foto ${v + 1}`}><img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}</div>
        <div className="stack">
          <Badge status={x.status || 'disponivel'} map={SALE_STATUS} />
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', margin: 0 }}>{x.marca} {x.modelo}</h1>
          <div className="price" style={{ fontSize: '2.2rem' }}>{x.preco ? brl(x.preco) : 'Preço sob consulta'}</div>
          <div className="specs">{[['Ano', x.ano], ['Horas de uso', x.horasUso], ['Estado', x.estado]].map(([k, v]) => <div key={k} className="spec"><span>{k}</span><strong>{v ?? '—'}</strong></div>)}</div>
          {x.descricao && <p>{x.descricao}</p>}
          {x.info && <div className="card small" style={{ whiteSpace: 'pre-line' }}><strong>Informações adicionais</strong><br />{x.info}</div>}
          <a className="btn btn-wa" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski à venda: ${x.marca || ''} ${x.modelo} ${x.ano || ''} (${x.preco ? brl(x.preco) : 'preço sob consulta'}).`)}><WaIcon size={18} /> Tenho interesse — falar no WhatsApp</a>
        </div>
      </div>
    </div></section>
  )
}
