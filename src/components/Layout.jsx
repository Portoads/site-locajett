import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDB, cartCount, calcCart, brl, clearCart, whatsNumber, waLink, fmtDate, getDB, diariasLabel } from '../store'
import { SITE, PH } from '../config'
import { Logo, WaIcon, JetPhoto, Toaster, Icon } from './ui'

const LINKS = [['/jet-skis', 'Frota'], ['/experiencias', 'Experiências'], ['/como-funciona', 'Como funciona'], ['/locais', 'Locais'], ['/venda', 'Venda'], ['/sobre', 'A Loca Jett'], ['/contato', 'Contato']]

export function MiniCart({ open, onClose }) {
  const db = useDB()
  const nav = useNavigate()
  const cart = db.cart
  const c = calcCart(cart)
  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" aria-label="Minha Reserva">
        <div className="flex between"><span className="eyebrow" style={{ margin: 0 }}>Minha Reserva</span><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar"><Icon name="close" size={14} /></button></div>
        <div className="divider" />
        {!c.jet ? (
          <div className="empty"><h3 className="serif" style={{ color: 'var(--text)' }}>Sua reserva está vazia</h3><p>Escolha um Jet Ski da nossa frota para começar.</p><button className="btn btn-primary" onClick={() => { onClose(); nav('/jet-skis') }}>Conhecer a frota</button></div>
        ) : (
          <>
            <div style={{ overflow: 'hidden', aspectRatio: '4/3' }}><JetPhoto jet={c.jet} /></div>
            <div style={{ marginTop: 18 }}><span className="jet-kicker">{c.jet.marca}</span><h3 style={{ margin: '4px 0 2px' }}>{c.jet.modelo}</h3><small className="muted">{diariasLabel(cart.diarias)} {cart.data ? `· ${fmtDate(cart.data)} — ${fmtDate(c.dataFim)}` : '· data a definir'}</small></div>
            <div className="divider" />
            <div className="line"><span>Locação</span><strong>{brl(c.base)}</strong></div>
            {c.itens.map((i) => <div className="line" key={i.nome}><span>{i.nome}</span><strong>{brl(i.preco)}</strong></div>)}
            {c.desconto > 0 && <div className="line"><span>Cupom {c.coupon.codigo}</span><strong style={{ color: 'var(--success)' }}>-{brl(c.desconto)}</strong></div>}
            <div className="divider" />
            <div className="total"><span>Total</span><span>{brl(c.total)}</span></div>
            <small className="muted">Sinal para confirmar ({c.entradaPct}%): <strong style={{ color: 'var(--text)' }}>{brl(c.entrada)}</strong></small>
            <div style={{ marginTop: 'auto', paddingTop: 24 }} className="stack">
              <button className="btn btn-primary btn-block" onClick={() => { onClose(); nav('/minha-reserva') }}>Concluir reserva</button>
              <button className="btn btn-ghost btn-block btn-sm" onClick={clearCart}>Esvaziar</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

export function Navbar() {
  const db = useDB()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const loc = useLocation()
  const n = cartCount(db.cart)
  const logged = db.session.clientId
  useEffect(() => { const f = () => setScrolled(window.scrollY > 30); f(); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f) }, [])
  useEffect(() => { setMenu(false); window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => { const o = () => setCartOpen(true); window.addEventListener('open-cart', o); return () => window.removeEventListener('open-cart', o) }, [])
  return (
    <>
      <header className={'nav ' + (scrolled || menu || loc.pathname !== '/' ? 'scrolled' : '')}>
        <div className="container nav-in">
          <Link to="/" aria-label="Loca Jett Oficial — início"><Logo /></Link>
          <nav className="nav-links" aria-label="Principal">{LINKS.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}</nav>
          <div className="nav-actions">
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Minha Reserva, ${n} itens`}>
              <Icon name="bag" size={16} /><span className="cart-label">Reserva</span>
              {n > 0 && <span className="cart-count">{n}</span>}
            </button>
            <Link to={logged ? '/cliente' : '/login'} className="btn btn-ghost btn-sm nav-account" aria-label={logged ? 'Minha conta' : 'Entrar'}><Icon name="user" size={15} /><span className="cart-label">{logged ? 'Minha conta' : 'Entrar'}</span></Link>
            <button className="burger" onClick={() => setMenu(!menu)} aria-label="Abrir menu" aria-expanded={menu}><Icon name={menu ? 'close' : 'menu'} size={18} /></button>
          </div>
        </div>
        <nav className={'mobile-menu ' + (menu ? 'open' : '')} aria-label="Menu mobile">
          {LINKS.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}
          <NavLink to="/minha-reserva">Minha Reserva {n > 0 && `(${n})`}</NavLink>
          <NavLink to={logged ? '/cliente' : '/login'}>{logged ? 'Minha conta' : 'Entrar'}</NavLink>
        </nav>
      </header>
      <MiniCart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

export function Footer() {
  const st = useDB().settings
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand"><Logo size={58} /><p>Locação de Jet Skis de alto padrão em Goiás. Frota nova, atendimento dedicado e experiências sob medida.</p>
            {st.instagram && <a href={st.instagramUrl || '#'} target="_blank" rel="noreferrer" className="flex" style={{ gap: 10 }}><Icon name="insta" size={17} /> {st.instagram}</a>}</div>
          <div className="stack"><h4>Navegação</h4>{LINKS.map(([to, l]) => <div key={to}><Link to={to}>{l}</Link></div>)}</div>
          <div className="stack"><h4>Cliente</h4><div><Link to="/minha-reserva">Minha Reserva</Link></div><div><Link to="/cliente">Área do cliente</Link></div><div><Link to="/login">Entrar</Link></div><div><Link to="/cadastro">Criar conta</Link></div></div>
          <div className="stack"><h4>Atendimento</h4>
            <a href={waLink(st.whatsapp, 'Olá! Vim pelo site da Loca Jett.')} target="_blank" rel="noreferrer">{st.telefone || SITE.telefone}</a>
            {(st.endereco || st.cidade) && <div className="small" style={{ color: 'var(--text-secondary)' }}>{[st.endereco, st.cidade].filter(Boolean).join(' — ')}</div>}
            <div className="small" style={{ color: 'var(--text-secondary)' }}>{st.diasFuncionamento || 'Atendimento mediante agendamento'}</div>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Loca Jett Oficial · Goiás{SITE.cnpj ? ' · CNPJ ' + SITE.cnpj : ''}</span><span>Dados tratados conforme a LGPD.</span></div>
      </div>
    </footer>
  )
}

export function PublicLayout() {
  const db = useDB()
  const num = whatsNumber()
  const [hideDemo, setHideDemo] = useState(false)
  return (
    <>
      <Navbar />
      <main id="conteudo"><Outlet /></main>
      <Footer />
      <a className="wa-float" href={waLink(num, 'Olá! Vim pelo site da Loca Jett Oficial e gostaria de informações sobre a locação de Jet Ski.')} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><WaIcon size={24} /></a>
      {db.settings.demo && !hideDemo && <div className="demo-banner"><button onClick={() => setHideDemo(true)} aria-label="Fechar aviso" style={{ float: 'right', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>×</button>Modo demonstração: Jet Skis, preços e locais são exemplos. Edite tudo em <Link to="/admin" style={{ textDecoration: 'underline' }}>/admin</Link>.</div>}
      <Toaster />
    </>
  )
}

export const PageHead = ({ eyebrow, title, text }) => (
  <section className="page-head"><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div></section>
)
export const openCart = () => window.dispatchEvent(new Event('open-cart'))
export const _db = getDB
