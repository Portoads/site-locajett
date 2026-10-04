import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDB, brl, updateCart, emptyCart, slotsFor, DURACOES, jetPrice, whatsNumber, waLink, getDB, today } from '../store'
import { JetArt, JetBadge, Reveal, Field, toast, WaIcon } from '../components/ui'
import { PageHead, openCart } from '../components/Layout'
import Calendar from '../components/Calendar'
import { SITE, PH } from '../config'

export function JetCard({ jet, i = 0 }) {
  const nav = useNavigate()
  const db = useDB()
  const loc = db.locations.find((l) => l.id === jet.localId)
  const reserve = () => { updateCart({ ...emptyCart(), jetId: jet.id, localId: jet.localId, duracao: 2 }); toast('🌊 Jet Ski adicionado à Minha Reserva'); nav('/jet-skis/' + jet.id + '#reservar') }
  return (
    <Reveal delay={i * 80} className="card card-hover jet-card">
      <Link to={'/jet-skis/' + jet.id} className="jet-media" aria-label={`Ver ${jet.marca} ${jet.modelo}`}><JetArt hue={jet.hue} /><JetBadge status={jet.status} /></Link>
      <div className="jet-body">
        <div><small className="muted">{jet.marca} · {jet.categoria} · {jet.ano}</small><h3 style={{ margin: '2px 0 0' }}>{jet.modelo}</h3><small className="muted">📍 {loc?.nome}</small></div>
        <div className="specs"><div className="spec"><span>Pessoas</span><strong>{jet.capacidade}</strong></div><div className="spec"><span>Potência</span><strong>{jet.potencia}</strong></div><div className="spec"><span>Vel. máx.</span><strong>{jet.velMax}</strong></div></div>
        <div className="flex between" style={{ marginTop: 'auto' }}><div className="price">{brl(jet.precoHora)}<small> /hora</small></div></div>
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
  const [q, setQ] = useState({ data: '', duracao: 2, pessoas: 2, localId: '' })
  const jets = db.jetskis.slice(0, 3)
  const exps = db.experiences.filter((e) => e.ativo).slice(0, 6)
  const search = () => { updateCart({ ...emptyCart(), ...q, jetId: null }); nav('/jet-skis' + (q.localId ? '?local=' + q.localId : '')) }
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
            <div className="hero-stats"><div><strong>Reserva online</strong><span>em poucos minutos</span></div><div><strong>Confirmação</strong><span>direto no WhatsApp</span></div><div><strong>Segurança</strong><span>coletes e orientação</span></div></div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="booking-bar" role="search" aria-label="Buscar disponibilidade">
          <Field label="📅 Data" id="bb-d"><input id="bb-d" type="date" className="input" min={today()} value={q.data} onChange={(e) => setQ({ ...q, data: e.target.value })} /></Field>
          <Field label="⏱️ Duração" id="bb-du"><select id="bb-du" className="input" value={q.duracao} onChange={(e) => setQ({ ...q, duracao: +e.target.value })}>{DURACOES.map((d) => <option key={d.h} value={d.h}>{d.label}</option>)}</select></Field>
          <Field label="👥 Pessoas" id="bb-p"><select id="bb-p" className="input" value={q.pessoas} onChange={(e) => setQ({ ...q, pessoas: +e.target.value })}>{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="📍 Local" id="bb-l"><select id="bb-l" className="input" value={q.localId} onChange={(e) => setQ({ ...q, localId: e.target.value })}><option value="">Todos os locais</option>{db.locations.filter((l) => l.ativo).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></Field>
          <button className="btn btn-primary" onClick={search}>Buscar Jet Skis</button>
        </div>
      </div>

      <section className="section" id="frota">
        <div className="container">
          <div className="flex between wrap" style={{ marginBottom: 32 }}>
            <Reveal><span className="eyebrow">Nossa frota</span><h2 style={{ margin: 0 }}>Escolha seu Jet Ski</h2></Reveal>
            <Link to="/jet-skis" className="btn btn-ghost">Ver todos →</Link>
          </div>
          <div className="grid g3">{jets.map((j, i) => <JetCard key={j.id} jet={j} i={i} />)}</div>
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
          <div className="grid g4">{[['🌊', 'Escolha o Jet Ski', 'Compare modelos, capacidade e preços.'], ['📅', 'Data e horário', 'Veja só os horários realmente livres.'], ['✨', 'Personalize', 'Adicione fotos, instrutor, VIP e mais.'], ['💬', 'Finalize no WhatsApp', 'Receba a confirmação da nossa equipe.']].map(([ic, t, d], i) => (
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
    .sort((a, b) => (f.ord === 'preco' ? a.precoHora - b.precoHora : b.precoHora - a.precoHora))
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
  const jet = db.jetskis.find((j) => j.id === id)
  const sameCart = db.cart?.jetId === id ? db.cart : null
  const [r, setR] = useState(() => ({ data: sameCart?.data || '', hora: sameCart?.hora || '', duracao: sameCart?.duracao || 2, pessoas: sameCart?.pessoas || 1, servicos: sameCart?.servicos || [] }))
  const [view, setView] = useState(0)
  const slots = useMemo(() => (r.data && jet ? slotsFor(jet.id, r.data, r.duracao) : []), [r.data, r.duracao, jet, db.reservations])
  if (!jet) return <PageHead eyebrow="Ops" title="Jet Ski não encontrado" />
  const loc = db.locations.find((l) => l.id === jet.localId)
  const price = jetPrice(jet, r.duracao)
  const extras = db.services.filter((s) => r.servicos.includes(s.id)).reduce((a, s) => a + s.preco, 0)
  const toggle = (sid) => setR({ ...r, servicos: r.servicos.includes(sid) ? r.servicos.filter((x) => x !== sid) : [...r.servicos, sid] })
  const add = (go) => {
    updateCart({ ...(sameCart || emptyCart()), jetId: jet.id, localId: jet.localId, ...r, hora: slots.includes(r.hora) ? r.hora : '' })
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
              <div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '16/10' }}><JetArt hue={(jet.hue + view * 25) % 360} /></div>
              <div className="grid g4" style={{ gap: 8, marginTop: 8 }}>{[0, 1, 2, 3].map((v) => <button key={v} onClick={() => setView(v)} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '16/10', cursor: 'pointer', borderColor: view === v ? 'var(--primary)' : undefined }} aria-label={`Foto ${v + 1}`}><JetArt hue={(jet.hue + v * 25) % 360} /></button>)}</div>
              <small className="muted">Imagens ilustrativas — substitua pelas fotos reais no painel.</small>
            </div>
            <div>
              <JetBadge status={jet.status} />
              <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginTop: 12 }}>{jet.marca} {jet.modelo}</h1>
              <p>{jet.descricao}</p>
              <div className="flex wrap" style={{ gap: 20, margin: '16px 0' }}>
                <div><div className="price">{brl(jet.precoHora)}</div><small className="muted">por hora</small></div>
                <div><div className="price">{brl(jet.precoPeriodo)}</div><small className="muted">meio período (4h)</small></div>
                <div><div className="price">{brl(jet.precoDiaria)}</div><small className="muted">diária (8h)</small></div>
              </div>
              <div className="specs" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {[['Ano', jet.ano], ['Categoria', jet.categoria], ['Potência', jet.potencia], ['Capacidade', jet.capacidade + ' pessoas'], ['Cor', jet.cor], ['Vel. máx.', jet.velMax], ['Caução', brl(jet.caucao)], ['Local', loc?.nome.split(' — ')[0]], ['ID', jet.identificacao]].map(([k, v]) => <div className="spec" key={k}><span>{k}</span><strong>{v}</strong></div>)}
              </div>
              <a href="#reservar" className="btn btn-primary" style={{ marginTop: 20 }}>Reservar este Jet Ski ↓</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container grid" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 28 }} id="reservar">
          <div className="stack">
            <div className="card"><h3>1. Escolha a data</h3>{disabled ? <p>Este Jet Ski está em manutenção no momento. Escolha outro modelo.</p> : <Calendar jetId={jet.id} value={r.data} onChange={(data) => setR({ ...r, data, hora: '' })} />}</div>
            <div className="card"><h3>2. Duração e horário</h3>
              <div className="flex wrap" style={{ marginBottom: 16 }}>{DURACOES.map((d) => <button key={d.h} className={'chip ' + (r.duracao === d.h ? 'on' : '')} onClick={() => setR({ ...r, duracao: d.h, hora: '' })}>{d.label}</button>)}</div>
              {!r.data ? <p className="muted small">Selecione uma data para ver os horários livres.</p> : slots.length ? <div className="slots">{slots.map((s) => <button key={s} className={'chip ' + (r.hora === s ? 'on' : '')} onClick={() => setR({ ...r, hora: s })}>{s}</button>)}</div> : <p className="small" style={{ color: 'var(--warning)' }}>Sem horários livres para essa duração nesta data.</p>}
            </div>
            <div className="card"><h3>3. Serviços adicionais</h3>
              <div className="grid g2" style={{ gap: 10 }}>{db.services.filter((s) => s.ativo).map((s) => (
                <label key={s.id} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: r.servicos.includes(s.id) ? 'var(--primary)' : undefined }}>
                  <div className="flex between"><span>{s.icon} <strong>{s.nome}</strong></span><input type="checkbox" checked={r.servicos.includes(s.id)} onChange={() => toggle(s.id)} /></div>
                  <small className="muted">{s.descricao}</small><div style={{ fontWeight: 700, marginTop: 4 }}>{brl(s.preco)}</div>
                </label>
              ))}</div>
            </div>
            <div className="grid g2">
              <div className="card"><h4>Características</h4><ul className="small" style={{ color: 'var(--text-secondary)', paddingLeft: 18 }}>{jet.caracteristicas.map((c) => <li key={c}>{c}</li>)}</ul></div>
              <div className="card"><h4>Regras e requisitos</h4><ul className="small" style={{ color: 'var(--text-secondary)', paddingLeft: 18 }}>{jet.regras.map((c) => <li key={c}>{c}</li>)}<li>Documento com foto no dia</li></ul></div>
            </div>
          </div>
          <aside>
            <div className="card" style={{ position: 'sticky', top: 96 }}>
              <h3>Resumo</h3>
              <div className="line"><span>Data</span><strong>{r.data ? r.data.split('-').reverse().join('/') : '—'}</strong></div>
              <div className="line"><span>Horário</span><strong>{r.hora || '—'}</strong></div>
              <div className="line"><span>Duração</span><strong>{r.duracao}h</strong></div>
              <div className="line"><span>Pessoas</span><select className="input" style={{ width: 80, padding: '4px 8px' }} value={r.pessoas} onChange={(e) => setR({ ...r, pessoas: +e.target.value })}>{Array.from({ length: jet.capacidade }, (_, i) => <option key={i}>{i + 1}</option>)}</select></div>
              <div className="divider" />
              <div className="line"><span>Jet Ski</span><strong>{brl(price)}</strong></div>
              <div className="line"><span>Adicionais</span><strong>{brl(extras)}</strong></div>
              <div className="total" style={{ marginTop: 8 }}><span>Total</span><span>{brl(price + extras)}</span></div>
              <small className="muted">+ caução devolvível de {brl(jet.caucao)}</small>
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
  const steps = [['🌊', 'Escolha o Jet Ski', 'Navegue pelo catálogo e compare capacidade, potência e preços.'], ['📅', 'Escolha data e horário', 'O calendário mostra apenas horários disponíveis — sem conflitos.'], ['⏱️', 'Defina a duração', '1h, 2h, 3h, meio período ou diária.'], ['✨', 'Adicione experiências', 'Instrutor, fotos, drone, VIP, decoração e mais.'], ['📝', 'Preencha seus dados', 'Rápido e seguro, conforme a LGPD.'], ['🛒', 'Revise em Minha Reserva', 'Confira valores, caução e descontos.'], ['💬', 'Finalize pelo WhatsApp', 'Sua reserva recebe um número (LJ-XXXXXX) e a mensagem é enviada pronta.'], ['🤝', 'Atendimento Loca Jett', 'Nossa equipe confirma e combina pagamento e detalhes.']]
  return (
    <>
      <PageHead eyebrow="Como funciona" title="Simples, rápido e seguro" text="Do clique até a água em poucos passos." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g4">
        {steps.map(([ic, t, d], i) => <Reveal key={t} delay={i * 50} className="card"><span className="badge tone-accent">{String(i + 1).padStart(2, '0')}</span><div style={{ fontSize: 30, marginTop: 12 }}>{ic}</div><h4 style={{ marginTop: 8 }}>{t}</h4><p className="small">{d}</p></Reveal>)}
      </div>
      <div className="container" style={{ marginTop: 48 }}><div className="card"><h3>Requisitos para pilotar</h3><ul style={{ color: 'var(--text-secondary)' }}><li>Documento oficial com foto</li><li>Habilitação náutica (Arrais Amador) ou passeio acompanhado por instrutor — {PH('CONFIRMAR REGRA DA EMPRESA')}</li><li>Uso obrigatório de colete salva-vidas</li><li>Caução devolvível conforme o modelo</li></ul></div></div>
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
  return (
    <>
      <PageHead eyebrow="Contato" title="Fale com a Loca Jett" text="Tire dúvidas, peça orçamento para grupos ou eventos." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container grid g2" style={{ alignItems: 'start' }}>
        <form className="card stack" onSubmit={send} noValidate>
          <Field label="Nome" id="c-n" error={err.nome}><input id="c-n" className={'input ' + (err.nome ? 'err' : '')} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="E-mail" id="c-e" error={err.email}><input id="c-e" type="email" className={'input ' + (err.email ? 'err' : '')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Mensagem" id="c-m" error={err.msg}><textarea id="c-m" rows={5} className={'input ' + (err.msg ? 'err' : '')} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <button className="btn btn-wa"><WaIcon size={18} /> Enviar pelo WhatsApp</button>
        </form>
        <div className="stack">{[['💬', 'WhatsApp', SITE.whatsapp || PH('WHATSAPP')], ['📞', 'Telefone', SITE.telefone || PH('TELEFONE')], ['✉️', 'E-mail', SITE.email || PH('E-MAIL')], ['📍', 'Endereço', SITE.endereco || PH('ENDEREÇO')], ['🕒', 'Horário', SITE.horario || PH('HORÁRIOS')], ['📸', 'Redes sociais', SITE.instagram || PH('REDES SOCIAIS')]].map(([i, t, v]) => <div key={t} className="card flex" style={{ padding: 16 }}><span style={{ fontSize: 24 }}>{i}</span><div><strong>{t}</strong><div className="small muted">{v}</div></div></div>)}</div>
      </div></section>
    </>
  )
}
