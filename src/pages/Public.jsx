import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDB, brl, updateCart, emptyCart, whatsNumber, waLink, getDB, today, rangeConflict, maxDiarias, rangeEnd, fmtDate, diariasLabel, SALE_STATUS } from '../store'
import { calcPrice } from '../shared'
import { DiariasPicker } from './MinhaReserva'
import { JetPhoto, JetBadge, Badge, Reveal, Field, toast, WaIcon, Icon } from '../components/ui'
import { PageHead, openCart } from '../components/Layout'
import Calendar from '../components/Calendar'
import { SITE, PHOTOS, clean } from '../config'

export function JetCard({ jet, i = 0 }) {
  const nav = useNavigate()
  const db = useDB()
  const loc = db.locations.find((l) => l.id === jet.localId)
  const promo = jet.precoOriginal > jet.precoDiaria
  const reserve = () => { updateCart({ ...emptyCart(), ...(db.cart?.data ? { data: db.cart.data, diarias: db.cart.diarias } : {}), jetId: jet.id, localId: jet.localId }); toast('Jet Ski adicionado à sua reserva'); nav('/jet-skis/' + jet.id + '#reservar') }
  return (
    <Reveal delay={i * 90} className="card card-hover jet-card">
      <Link to={'/jet-skis/' + jet.id} className="jet-media" style={{ aspectRatio: '4/3' }} aria-label={`Ver ${jet.marca} ${jet.modelo}`}><JetPhoto jet={jet} /><JetBadge status={jet.status} /></Link>
      <div className="jet-body">
        <div><span className="jet-kicker">{[jet.marca, jet.categoria, jet.ano].filter(Boolean).join(' · ')}</span><h3 style={{ margin: '8px 0 0' }}>{jet.modelo}</h3>{loc && <small className="muted">{loc.nome}</small>}</div>
        <div className="specs"><div className="spec"><span>Potência</span><strong>{jet.potencia || '—'}</strong></div><div className="spec"><span>Ano</span><strong>{jet.ano || '—'}</strong></div><div className="spec"><span>Pessoas</span><strong>{jet.capacidade || 'Consulte'}</strong></div></div>
        <div className="price-row">
          <div>{promo && <div className="price-old">{brl(jet.precoOriginal)}</div>}<div className="price">{brl(jet.precoDiaria)}<small> / diária</small></div></div>
          {promo && <span className="badge tone-accent">Condição especial</span>}
        </div>
        <div className="jet-actions">
          <Link to={'/jet-skis/' + jet.id} className="btn btn-ghost btn-sm">Detalhes</Link>
          <button className="btn btn-primary btn-sm" onClick={reserve} disabled={jet.status === 'manutencao' || jet.status === 'indisponivel'}>Reservar</button>
        </div>
      </div>
    </Reveal>
  )
}

const PILLARS = [
  ['Frota nova', 'Jet Skis de modelos recentes, revisados antes de cada locação e entregues impecáveis.'],
  ['Segurança em primeiro lugar', 'Coletes, orientação antes da saída e regras claras para você aproveitar com tranquilidade.'],
  ['Atendimento dedicado', 'Um contato direto do início ao fim — da escolha do modelo à devolução.'],
  ['Sob medida', 'Várias diárias, grupos, datas especiais e eventos planejados do seu jeito.'],
]

export function Home() {
  const db = useDB()
  const nav = useNavigate()
  const [q, setQ] = useState({ data: '', diarias: 1, jetId: '' })
  const jets = db.jetskis.slice(0, 3)
  const exps = db.experiences.filter((e) => e.ativo).slice(0, 6)
  const search = () => { if (q.jetId) { updateCart({ ...emptyCart(), data: q.data, diarias: q.diarias, jetId: q.jetId, localId: db.jetskis.find((j) => j.id === q.jetId)?.localId }); nav('/jet-skis/' + q.jetId + '#reservar') } else { updateCart({ ...emptyCart(), data: q.data, diarias: q.diarias, jetId: null }); nav('/jet-skis') } }
  const promos = db.promos || db.coupons.filter((c) => c.ativo && c.imagem)
  const minPrice = Math.min(...db.jetskis.map((j) => j.precoDiaria || Infinity))
  return (
    <>
      <section className="hero">
        <div className="hero-media" style={{ backgroundImage: `url(${PHOTOS.hero})` }} aria-hidden="true" />
        <div className="container">
          <div className="hero-content">
            <span className="eyebrow">Loca Jett Oficial · Goiás</span>
            <h1>Exclusividade sobre as águas de <em>Goiás</em>.</h1>
            <p className="lead">Jet Skis novos de alta performance, atendimento dedicado e experiências sob medida nos lagos do estado. Reserve sua diária em poucos minutos.</p>
            <div className="hero-actions">
              <Link to="/jet-skis" className="btn btn-primary">Reservar agora <Icon name="arrow" size={16} /></Link>
              <a href="#frota" className="btn btn-ghost">Conhecer a frota</a>
            </div>
            <div className="hero-stats">
              {isFinite(minPrice) && <div><strong>{brl(minPrice)}</strong><span>Diária a partir de</span></div>}
              <div><strong>{db.settings.entradaPct}%</strong><span>Sinal para confirmar</span></div>
              <div><strong>Goiás</strong><span>De norte a sul do estado</span></div>
            </div>
          </div>
        </div>
        <span className="scroll-cue" aria-hidden="true" />
      </section>

      <div className="container">
        <div className="booking-bar" role="search" aria-label="Consultar disponibilidade">
          <Field label="Data de início" id="bb-d"><input id="bb-d" type="date" className="input" min={today()} value={q.data} onChange={(e) => setQ({ ...q, data: e.target.value })} /></Field>
          <Field label="Diárias" id="bb-du"><select id="bb-du" className="input" value={q.diarias} onChange={(e) => setQ({ ...q, diarias: +e.target.value })}>{Array.from({ length: Number(db.settings.diariasMax) || 15 }, (_, i) => <option key={i} value={i + 1}>{diariasLabel(i + 1)}</option>)}</select></Field>
          <Field label="Modelo" id="bb-j"><select id="bb-j" className="input" value={q.jetId} onChange={(e) => setQ({ ...q, jetId: e.target.value })}><option value="">Todos os modelos</option>{db.jetskis.map((j) => <option key={j.id} value={j.id}>{j.marca} {j.modelo}</option>)}</select></Field>
          <button className="btn btn-primary" onClick={search}>Consultar</button>
        </div>
      </div>

      <section className="section" id="frota">
        <div className="container">
          <Reveal className="section-head center">
            <span className="eyebrow">A frota</span>
            <h2>Escolha o seu <em>Jet Ski</em></h2>
            <p>Modelos novos de alta performance, revisados antes de cada locação e entregues com coletes e orientação de segurança.</p>
          </Reveal>
          <div className={'fleet-grid ' + (jets.length < 3 ? 'n' + jets.length : '')}>{jets.map((j, i) => <JetCard key={j.id} jet={j} i={i} />)}</div>
          <div className="center" style={{ marginTop: 48 }}><Link to="/jet-skis" className="link-arrow">Ver toda a frota <Icon name="arrow" size={15} /></Link></div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--background-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container split stretch">
          <Reveal className="photo"><img src={PHOTOS.action} alt="Jet Ski em alta velocidade sobre a água" loading="lazy" /></Reveal>
          <Reveal delay={120} className="split-copy">
            <span className="eyebrow">O padrão Loca Jett</span>
            <h2>Cada detalhe pensado para o seu <em>dia na água</em>.</h2>
            <p style={{ maxWidth: 480 }}>Não alugamos apenas um Jet Ski. Entregamos uma experiência completa, com o cuidado e a discrição que você espera.</p>
            <div className="numbered n2" style={{ marginTop: 36 }}>
              {PILLARS.map(([t, d], i) => <div key={t}><span className="n">{String(i + 1).padStart(2, '0')}</span><h4>{t}</h4><p>{d}</p></div>)}
            </div>
          </Reveal>
        </div>
      </section>

      {exps.length > 0 && <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div><span className="eyebrow">Experiências</span><h2>Mais que uma locação, <em>um momento</em>.</h2></div>
            <p style={{ maxWidth: 420, margin: '0 0 6px' }}>Do dia inteiro no comando a pacotes para grupos e eventos — escolha o formato ideal e nós cuidamos do resto.</p>
          </Reveal>
          <Reveal className="list-rows">{exps.map((e, i) => (
            <div key={e.id}><span className="n">{String(i + 1).padStart(2, '0')}</span><div><h3>{e.nome}</h3><p>{e.descricao}</p></div><Link to="/experiencias" className="link-arrow">Saiba mais <Icon name="arrow" size={14} /></Link></div>
          ))}</Reveal>
        </div>
      </section>}

      {promos.length > 0 && <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head center"><span className="eyebrow">Condições especiais</span><h2>Benefícios <em>exclusivos</em></h2><p style={{ maxWidth: 560 }}>Solicite seu cupom pelo WhatsApp{db.settings.instagram ? ' ou Instagram ' + db.settings.instagram : ''} e aplique em Minha Reserva. Válido por {promos[0].validadeDias || 30} dias após o recebimento.</p></Reveal>
          <div className="promo-grid">{promos.map((c, i) => <Reveal key={c.id} delay={i * 80}><a href={waLink(whatsNumber(), `Olá! Gostaria de receber o cupom de ${c.valor}% de desconto da Loca Jett.`)} target="_blank" rel="noreferrer" className="card card-hover promo-card"><img src={c.imagem} alt={`Cupom de ${c.valor}% de desconto`} loading="lazy" /><div className="promo-foot"><span>{c.valor}% de desconto</span><span>Solicitar <Icon name="arrow" size={14} /></span></div></a></Reveal>)}</div>
        </div>
      </section>}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head"><div><span className="eyebrow">Como funciona</span><h2>Da reserva à água em <em>quatro etapas</em></h2></div><Link to="/como-funciona" className="link-arrow">Ver detalhes <Icon name="arrow" size={14} /></Link></Reveal>
          <div className="numbered">{[['Escolha o modelo', 'Compare potência, ano e valor da diária.'], ['Data e diárias', 'O calendário mostra apenas os dias realmente livres.'], ['Sinal de confirmação', `${db.settings.entradaPct}% via Pix ou cartão para garantir a data.`], ['Atendimento direto', 'Finalize pelo WhatsApp e combine retirada e devolução.']].map(([t, d], i) => (
            <Reveal key={t} delay={i * 80}><span className="n">{String(i + 1).padStart(2, '0')}</span><h4>{t}</h4><p>{d}</p></Reveal>
          ))}</div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="card sale-band">
            <div><span className="eyebrow">Venda de Jet Skis</span><h3>Pensando em ter o seu?</h3><p>Conheça os modelos à venda e negocie diretamente com a Loca Jett.</p></div>
            <Link to="/venda" className="btn btn-ghost">Ver modelos à venda <Icon name="arrow" size={15} /></Link>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <div className="bg" style={{ backgroundImage: `url(${PHOTOS.sunset})` }} aria-hidden="true" />
        <div className="container">
          <Reveal className="center">
            <span className="eyebrow">Loca Jett Oficial</span>
            <h2 style={{ maxWidth: 760, margin: '0 auto 20px' }}>Sua próxima experiência <em>começa na água</em>.</h2>
            <p style={{ maxWidth: 500, margin: '0 auto 36px', color: '#D9D4CA' }}>Garanta sua data agora e finalize em poucos minutos com nosso atendimento.</p>
            <div className="cta-actions"><Link to="/jet-skis" className="btn btn-primary">Reservar agora</Link><a className="btn btn-ghost" href={waLink(whatsNumber(), 'Olá! Gostaria de reservar um Jet Ski com a Loca Jett Oficial.')} target="_blank" rel="noreferrer"><WaIcon size={16} /> Falar com um consultor</a></div>
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
      <PageHead eyebrow="A frota" title={<>Jet Skis <em>disponíveis</em></>} text="Modelos novos de alta performance, entregues revisados, com coletes e orientação de segurança." />
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="flex wrap filters" style={{ marginBottom: 40, gap: 10, justifyContent: 'center' }}>
            <button className={'chip ' + (!f.cat ? 'on' : '')} onClick={() => setF({ ...f, cat: '' })}>Todos</button>
            {cats.map((c) => <button key={c} className={'chip ' + (f.cat === c ? 'on' : '')} onClick={() => setF({ ...f, cat: c })}>{c}</button>)}
            <select className="input" style={{ width: 'auto' }} value={f.local} onChange={(e) => setF({ ...f, local: e.target.value })} aria-label="Filtrar por local"><option value="">Todos os locais</option>{db.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
            <select className="input" style={{ width: 'auto' }} value={f.cap} onChange={(e) => setF({ ...f, cap: +e.target.value })} aria-label="Capacidade"><option value={0}>Qualquer capacidade</option><option value={2}>2+ pessoas</option><option value={3}>3 pessoas</option></select>
            <select className="input" style={{ width: 'auto' }} value={f.ord} onChange={(e) => setF({ ...f, ord: e.target.value })} aria-label="Ordenar"><option value="preco">Menor preço</option><option value="-preco">Maior preço</option></select>
          </div>
          {list.length ? <div className={'fleet-grid ' + (list.length < 3 ? 'n' + list.length : '')}>{list.map((j, i) => <JetCard key={j.id} jet={j} i={i} />)}</div> : <div className="empty card">Nenhum Jet Ski encontrado com esses filtros.</div>}
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
    toast('Adicionado à sua reserva')
    go ? nav('/minha-reserva') : openCart()
  }
  const disabled = ['manutencao', 'indisponivel'].includes(jet.status)
  return (
    <>
      <section className="page-head" style={{ paddingBottom: 40 }}>
        <div className="container">
          <Link to="/jet-skis" className="back-link"><Icon name="back" size={14} /> Voltar à frota</Link>
          <div className="grid g2" style={{ marginTop: 32, alignItems: 'start', gap: 'clamp(28px,5vw,72px)' }}>
            <div>
              <div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '4/3' }}><JetPhoto jet={jet} i={view} fit="cover" /></div>
              {fotos.length > 1 && <div className="grid g4" style={{ gap: 8, marginTop: 8 }}>{fotos.map((f, v) => <button key={v} onClick={() => setView(v)} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', borderColor: view === v ? 'var(--primary)' : undefined }} aria-label={`Foto ${v + 1}`}><img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
            </div>
            <div>
              <JetBadge status={jet.status} />
              <div className="jet-kicker" style={{ marginTop: 20 }}>{jet.marca}</div>
              <h1 style={{ fontSize: 'clamp(2.6rem,5vw,4.2rem)', margin: '4px 0 16px' }}>{jet.modelo}</h1>
              <p style={{ fontSize: '1.05rem', maxWidth: 520 }}>{jet.descricao}</p>
              <div className="flex wrap" style={{ gap: 20, margin: '28px 0', alignItems: 'flex-end' }}>
                <div>{jet.precoOriginal > jet.precoDiaria && <div className="price-old">{brl(jet.precoOriginal)}</div>}<div className="price" style={{ fontSize: '3rem' }}>{brl(jet.precoDiaria)}</div><small className="muted">por diária · mínimo de 1 diária</small></div>
                {jet.precoOriginal > jet.precoDiaria && <span className="badge tone-accent">Condição especial</span>}
              </div>
              <div className="specs-grid">
                {[['Ano', jet.ano], ['Categoria', jet.categoria], ['Potência', jet.potencia || '—'], ['Capacidade', jet.capacidade ? jet.capacidade + ' pessoas' : 'Consulte'], ['Cor', jet.cor || '—'], ['Combustível', 'Não incluso'], ['Idade mínima', s.idadeMinima + ' anos'], ['Local', loc?.nome?.split(' — ')[0]], ['Entrada', s.entradaPct + '% na reserva']].map(([k, v]) => <div className="spec" key={k}><span>{k}</span><strong>{v}</strong></div>)}
              </div>
              <a href="#reservar" className="btn btn-primary" style={{ marginTop: 28 }}>Reservar este Jet Ski <Icon name="down" size={15} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container grid" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 28 }} id="reservar">
          <div className="stack">
            <div className="card"><span className="eyebrow">Etapa 01</span><h3>Data de início</h3>{disabled ? <p>Este Jet Ski está indisponível no momento. Escolha outro modelo.</p> : <Calendar jetId={jet.id} value={r.data} onChange={(data) => setR({ ...r, data, diarias: Math.min(r.diarias, Math.max(1, maxDiarias(jet.id, data))) })} />}</div>
            <div className="card"><span className="eyebrow">Etapa 02</span><h3>Quantidade de diárias</h3>
              <DiariasPicker jetId={jet.id} data={r.data} value={r.diarias} onChange={(diarias) => setR({ ...r, diarias })} />
              {conflict && <p className="err-msg" style={{ marginTop: 8 }}>Parte desse período já está reservada ou bloqueada.</p>}
              <p className="small muted" style={{ marginTop: 10 }}>Locação somente por diária. {s.horarioRetirada ? `Retirada: ${s.horarioRetirada}. ` : ''}{s.horarioDevolucao ? `Devolução: ${s.horarioDevolucao}.` : ''}</p>
            </div>
            {db.services.some((x) => x.ativo) && <div className="card"><span className="eyebrow">Etapa 03</span><h3>Serviços adicionais</h3>
              <div className="grid g2" style={{ gap: 10 }}>{db.services.filter((x) => x.ativo).map((x) => (
                <label key={x.id} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: r.servicos.includes(x.id) ? 'var(--primary)' : undefined }}>
                  <div className="flex between"><strong>{x.nome}</strong><input type="checkbox" checked={r.servicos.includes(x.id)} onChange={() => toggle(x.id)} /></div>
                  <small className="muted">{x.descricao}</small><div style={{ fontWeight: 700, marginTop: 4 }}>{brl(x.preco)}</div>
                </label>
              ))}</div>
            </div>}
            <div className="grid g2">
              <div className="card"><h4>Características</h4><ul className="check-list">{(jet.caracteristicas || []).map((c) => <li key={c}>{c}</li>)}</ul></div>
              <div className="card"><h4>Regras e requisitos</h4><ul className="check-list">{(jet.regras || []).map((c) => <li key={c}>{c}</li>)}{s.exigeHabilitacao && <li>{s.textoHabilitacao}</li>}{s.documentos && <li>Documentos: {s.documentos}</li>}</ul></div>
            </div>
          </div>
          <aside>
            <div className="card" style={{ position: 'sticky', top: 96 }}>
              <span className="eyebrow">Resumo</span>
              <div className="line"><span>Início</span><strong>{r.data ? fmtDate(r.data) : '—'}</strong></div>
              <div className="line"><span>Término</span><strong>{r.data ? fmtDate(rangeEnd(r.data, r.diarias)) : '—'}</strong></div>
              <div className="line"><span>Diárias</span><strong>{r.diarias}</strong></div>
              <div className="divider" />
              <div className="line"><span>{diariasLabel(r.diarias)} × {brl(jet.precoDiaria)}</span><strong>{brl(p.base)}</strong></div>
              {p.adicionais > 0 && <div className="line"><span>Adicionais</span><strong>{brl(p.adicionais)}</strong></div>}
              {p.economia > 0 && <div className="line"><span className="small">Você economiza</span><strong className="small" style={{ color: 'var(--success)' }}>{brl(p.economia)}</strong></div>}
              <div className="total" style={{ marginTop: 8 }}><span>Total</span><span>{brl(p.total)}</span></div>
              <div className="line"><span>Sinal ({p.entradaPct}%) · Pix ou cartão</span><strong style={{ color: 'var(--primary)' }}>{brl(p.entrada)}</strong></div>
              <div className="stack" style={{ marginTop: 16 }}>
                <button className="btn btn-primary btn-block" disabled={disabled} onClick={() => add(true)}>Continuar reserva</button>
                <button className="btn btn-ghost btn-block" disabled={disabled} onClick={() => add(false)}>Adicionar à reserva</button>
                <a className="btn btn-wa btn-block btn-sm" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski ${jet.marca} ${jet.modelo}. Pode me passar mais informações?`)} target="_blank" rel="noreferrer"><WaIcon size={15} /> Falar com um consultor</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <style>{`@media (max-width: 900px){ #reservar{ grid-template-columns: 1fr !important } }`}</style>
    </>
  )
}

const EXP_PHOTOS = [PHOTOS.hero, PHOTOS.action, PHOTOS.sunset]

export function Experiencias() {
  const db = useDB()
  return (
    <>
      <PageHead eyebrow="Experiências" title={<>Escolha o seu <em>momento</em> na água</>} text="Formatos pensados para cada ocasião. Selecione uma experiência e, em seguida, o Jet Ski." />
      <section className="section" style={{ paddingTop: 64 }}><div className="container grid g3" style={{ gap: 32 }}>
        {db.experiences.filter((e) => e.ativo).map((e, i) => (
          <Reveal key={e.id} delay={i * 80} className="card card-hover" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="photo" style={{ aspectRatio: '4/3' }}><img src={EXP_PHOTOS[i % EXP_PHOTOS.length]} alt="" loading="lazy" /></div>
            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', flex: 1 }}><span className="eyebrow">{String(i + 1).padStart(2, '0')}</span><h3>{e.nome}</h3><p>{e.descricao}</p>
              <div className="flex between" style={{ marginTop: 'auto', paddingTop: 12 }}><span className="jet-kicker">{e.preco ? '+ ' + brl(e.preco) : 'Incluso na diária'}</span><Link to="/jet-skis" className="btn btn-primary btn-sm" onClick={() => updateCart({ ...(getDB().cart || emptyCart()), experienciaId: e.id })}>Escolher</Link></div></div>
          </Reveal>
        ))}
      </div></section>
    </>
  )
}

export function ComoFunciona() {
  const s = useDB().settings
  const steps = [['Escolha o Jet Ski', 'Compare modelos, potência e o valor da diária.'], ['Escolha a data', 'O calendário mostra apenas os dias disponíveis — sem conflitos.'], ['Defina as diárias', 'Locação por diária, com mínimo de uma. O total é calculado na hora.'], ['Seus dados', `Titular com ${s.idadeMinima} anos ou mais. Dados protegidos conforme a LGPD.`], [`Sinal de ${s.entradaPct}%`, 'Via Pix ou cartão para confirmar a sua data.'], ['Finalize pelo WhatsApp', 'Sua reserva recebe um código (LJ-XXXXXX) e a mensagem segue pronta.'], ['Atendimento Loca Jett', 'Nossa equipe confirma e combina retirada e devolução.'], ['Aproveite', 'O restante é pago conforme combinado.']]
  const req = [`Idade mínima: ${s.idadeMinima} anos`, s.exigeHabilitacao && s.textoHabilitacao, s.documentos && `Documentos: ${s.documentos}`, s.seguranca && s.seguranca].filter(Boolean)
  const rules = ['Locação por diária — mínimo de 1 diária', `Sinal de ${s.entradaPct}% para confirmar (Pix ou cartão)`, 'Combustível não incluso', (s.horarioRetirada || s.horarioDevolucao) && `Retirada: ${s.horarioRetirada || 'a combinar'} · Devolução: ${s.horarioDevolucao || 'a combinar'}`, s.diasFuncionamento && `Funcionamento: ${s.diasFuncionamento}`, s.cancelamento && `Cancelamento: ${s.cancelamento}`, s.chuva && `Chuva / mau tempo: ${s.chuva}`].filter(Boolean)
  return (
    <>
      <PageHead eyebrow="Como funciona" title={<>Simples, ágil e <em>seguro</em></>} text="Do primeiro clique até a água, com acompanhamento da nossa equipe em cada etapa." />
      <section className="section" style={{ paddingTop: 48 }}><div className="container">
        <div className="numbered" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {steps.map(([t, d], i) => <Reveal key={t} delay={i * 50}><span className="n">{String(i + 1).padStart(2, '0')}</span><h4>{t}</h4><p>{d}</p></Reveal>)}
        </div>
        <div className="grid g2" style={{ marginTop: 80, gap: 32 }}>
          <div className="card"><span className="eyebrow">Requisitos</span><h3>Para pilotar</h3><ul className="check-list">{req.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="card"><span className="eyebrow">Condições</span><h3>Regras da locação</h3><ul className="check-list">{rules.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      </div></section>
    </>
  )
}

const REGIONS = ['Norte', 'Oeste', 'Centro', 'Leste', 'Sul']
export function Locais() {
  const db = useDB()
  const [reg, setReg] = useState('')
  const all = db.locations.filter((l) => l.ativo)
  const locs = all.filter((l) => !reg || l.regiao === reg)
  const regions = REGIONS.filter((r) => all.some((l) => l.regiao === r))
  return (
    <>
      <PageHead eyebrow="Área de atuação" title={<>Em todo o estado de <em>Goiás</em></>} text="Atendemos de norte a sul do estado. Consulte os pontos de embarque e a disponibilidade para o seu destino." />
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container split" style={{ alignItems: 'start' }}>
          <Reveal className="photo" style={{ aspectRatio: '4/5' }}><img src={PHOTOS.sunset} alt="Jet Ski ao pôr do sol em um lago" loading="lazy" /></Reveal>
          <div>
            {regions.length > 1 && <div className="flex wrap" style={{ marginBottom: 24, gap: 8 }}><button className={'chip ' + (!reg ? 'on' : '')} onClick={() => setReg('')}>Todas</button>{regions.map((r) => <button key={r} className={'chip ' + (reg === r ? 'on' : '')} onClick={() => setReg(r)}>{r}</button>)}</div>}
            {locs.map((l) => {
              const jets = db.jetskis.filter((j) => j.localId === l.id)
              const desc = clean(l.descricao)
              return <div key={l.id} style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}><span className="jet-kicker">Região {l.regiao}</span><h3 style={{ margin: '8px 0 10px', fontSize: '2rem' }}>{l.nome}</h3>{desc && <p>{desc}</p>}<p className="small muted">{jets.filter((j) => j.status === 'disponivel').length} de {jets.length} Jet Skis disponíveis neste ponto</p><Link to={'/jet-skis?local=' + l.id} className="link-arrow">Ver Jet Skis deste local <Icon name="arrow" size={14} /></Link></div>
            })}
            <div className="card" style={{ marginTop: 32 }}><h4>Seu destino não está na lista?</h4><p className="small">Levamos a experiência até outros lagos e represas de Goiás mediante consulta.</p><a className="btn btn-ghost btn-sm" href={waLink(whatsNumber(), 'Olá! Gostaria de consultar a locação de Jet Ski para outra cidade/lago em Goiás.')} target="_blank" rel="noreferrer"><WaIcon size={14} /> Consultar destino</a></div>
          </div>
        </div>
      </section>
    </>
  )
}

export function Sobre() {
  return (
    <>
      <PageHead eyebrow="A Loca Jett" title={<>Liberdade, performance e <em>cuidado</em></>} text="Locação de Jet Skis e experiências náuticas em todo o estado de Goiás." />
      <section className="section" style={{ paddingTop: 64 }}><div className="container split">
        <Reveal>
          <p className="quote">“Transformar um dia comum em uma lembrança inesquecível — com segurança, equipamentos impecáveis e atendimento à altura.”</p>
          <div className="divider" style={{ margin: '36px 0' }} />
          <p>A Loca Jett Oficial nasceu para oferecer uma experiência de locação diferente: frota nova, processos claros e um atendimento próximo, do primeiro contato à devolução. Cuidamos de cada detalhe para que você só precise aproveitar.</p>
          <div className="numbered" style={{ marginTop: 32 }}>{[['Segurança', 'Orientação antes de cada saída e equipamentos obrigatórios.'], ['Excelência', 'Jet Skis revisados e entregues em perfeito estado.'], ['Atendimento', 'Contato direto e personalizado com a nossa equipe.']].map(([t, d], i) => <div key={t}><span className="n">{String(i + 1).padStart(2, '0')}</span><h4>{t}</h4><p>{d}</p></div>)}</div>
        </Reveal>
        <Reveal delay={150} className="photo" style={{ aspectRatio: '4/5' }}><img src={PHOTOS.hero} alt="Jet Skis ao pôr do sol" loading="lazy" /></Reveal>
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
  const rows = [
    ['phone', 'WhatsApp', s.telefone || SITE.telefone, waLink(whatsNumber(), 'Olá! Vim pelo site da Loca Jett.')],
    s.instagram && ['insta', 'Instagram', s.instagram, s.instagramUrl],
    (s.endereco || s.cidade) && ['pin', 'Localização', [s.endereco, s.cidade].filter(Boolean).join(' — '), s.mapsUrl],
    ['clock', 'Atendimento', s.diasFuncionamento || 'Mediante agendamento'],
    (s.horarioRetirada || s.horarioDevolucao) && ['calendar', 'Retirada / devolução', `${s.horarioRetirada || 'a combinar'} / ${s.horarioDevolucao || 'a combinar'}`],
  ].filter(Boolean)
  return (
    <>
      <PageHead eyebrow="Contato" title={<>Fale com a <em>Loca Jett</em></>} text="Dúvidas, grupos, pacotes sob medida ou Jet Skis à venda — nossa equipe responde pessoalmente." />
      <section className="section" style={{ paddingTop: 64 }}><div className="container split" style={{ alignItems: 'start' }}>
        <form className="card stack" onSubmit={send} noValidate style={{ padding: 'clamp(24px,4vw,44px)' }}>
          <h3 style={{ marginBottom: 12 }}>Envie uma mensagem</h3>
          <Field label="Nome" id="c-n" error={err.nome}><input id="c-n" className={'input ' + (err.nome ? 'err' : '')} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="E-mail" id="c-e" error={err.email}><input id="c-e" type="email" className={'input ' + (err.email ? 'err' : '')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Mensagem" id="c-m" error={err.msg}><textarea id="c-m" rows={5} className={'input ' + (err.msg ? 'err' : '')} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <button className="btn btn-primary" style={{ marginTop: 20 }}>Enviar pelo WhatsApp</button>
        </form>
        <div>
          {rows.map(([ic, t, v, href]) => <div key={t} className="info-row"><Icon name={ic} size={20} /><div><strong>{t}</strong>{href ? <a href={href} target="_blank" rel="noreferrer">{v}</a> : <span>{v}</span>}</div></div>)}
          {s.mapsUrl && <a className="btn btn-ghost" style={{ marginTop: 24 }} href={s.mapsUrl} target="_blank" rel="noreferrer"><Icon name="map" size={15} /> Ver no Google Maps</a>}
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
      <PageHead eyebrow="Venda de Jet Skis" title={<>Jet Skis <em>à venda</em></>} text="Seminovos e oportunidades selecionadas pela Loca Jett. Negocie diretamente com a nossa equipe." />
      <section className="section" style={{ paddingTop: 56 }}><div className="container">
        {list.length ? <div className="grid g3" style={{ gap: 32 }}>{list.map((x, i) => (
          <Reveal key={x.id} delay={i * 60} className="card card-hover jet-card">
            <Link to={'/venda/' + x.id} className="jet-media" style={{ aspectRatio: '4/3' }}><JetPhoto jet={x} /><Badge status={x.status || 'disponivel'} map={SALE_STATUS} /></Link>
            <div className="jet-body">
              <div><span className="jet-kicker">{[x.marca, x.ano].filter(Boolean).join(' · ')}</span><h3 style={{ margin: '6px 0 0', fontSize: '2rem' }}>{x.modelo}</h3></div>
              <div className="specs"><div className="spec"><span>Ano</span><strong>{x.ano || '—'}</strong></div><div className="spec"><span>Horas</span><strong>{x.horasUso ?? '—'}</strong></div><div className="spec"><span>Estado</span><strong>{x.estado || '—'}</strong></div></div>
              <div className="price" style={{ marginTop: 'auto' }}>{x.preco ? brl(x.preco) : 'Sob consulta'}</div>
              <div className="jet-actions"><Link to={'/venda/' + x.id} className="btn btn-ghost btn-sm">Detalhes</Link><a className="btn btn-primary btn-sm" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski à venda: ${x.marca || ''} ${x.modelo} ${x.ano || ''}.`)}>Tenho interesse</a></div>
            </div>
          </Reveal>
        ))}</div> : <div className="card empty" style={{ padding: 'clamp(40px,6vw,80px) 24px' }}><h3 className="serif" style={{ color: 'var(--text)' }}>Novas oportunidades em breve</h3><p style={{ maxWidth: 440, margin: '0 auto 24px' }}>Deseja comprar ou vender um Jet Ski? Fale com a nossa equipe e receba as próximas ofertas em primeira mão.</p><a className="btn btn-primary" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), 'Olá! Gostaria de informações sobre Jet Skis à venda.')}>Falar com um consultor</a></div>}
      </div></section>
    </>
  )
}

export function VendaDetalhe() {
  const { id } = useParams()
  const db = useDB()
  const [view, setView] = useState(0)
  const x = (db.sales || []).find((s) => s.id === id)
  if (!x) return <PageHead eyebrow="Venda" title="Anúncio não encontrado" />
  const fotos = x.fotos || []
  return (
    <section className="page-head"><div className="container">
      <Link to="/venda" className="back-link"><Icon name="back" size={14} /> Voltar para Jet Skis à venda</Link>
      <div className="grid g2" style={{ marginTop: 32, alignItems: 'start', gap: 'clamp(28px,5vw,72px)' }}>
        <div><div className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '4/3' }}><JetPhoto jet={x} i={view} fit="cover" /></div>
          {fotos.length > 1 && <div className="grid g4" style={{ gap: 8, marginTop: 8 }}>{fotos.map((f, v) => <button key={v} onClick={() => setView(v)} className="card" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', borderColor: view === v ? 'var(--primary)' : undefined }} aria-label={`Foto ${v + 1}`}><img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}</div>
        <div className="stack">
          <div><Badge status={x.status || 'disponivel'} map={SALE_STATUS} /></div>
          <div className="jet-kicker">{x.marca}</div>
          <h1 style={{ fontSize: 'clamp(2.6rem,5vw,4.2rem)', margin: 0 }}>{x.modelo}</h1>
          <div className="price" style={{ fontSize: '3rem' }}>{x.preco ? brl(x.preco) : 'Preço sob consulta'}</div>
          <div className="specs">{[['Ano', x.ano], ['Horas de uso', x.horasUso], ['Estado', x.estado]].map(([k, v]) => <div key={k} className="spec"><span>{k}</span><strong>{v ?? '—'}</strong></div>)}</div>
          {x.descricao && <p>{x.descricao}</p>}
          {x.info && <div className="card small" style={{ whiteSpace: 'pre-line' }}><strong>Informações adicionais</strong><br />{x.info}</div>}
          <a className="btn btn-primary" target="_blank" rel="noreferrer" href={waLink(whatsNumber(), `Olá! Tenho interesse no Jet Ski à venda: ${x.marca || ''} ${x.modelo} ${x.ano || ''} (${x.preco ? brl(x.preco) : 'preço sob consulta'}).`)}><WaIcon size={16} /> Tenho interesse</a>
        </div>
      </div>
    </div></section>
  )
}
