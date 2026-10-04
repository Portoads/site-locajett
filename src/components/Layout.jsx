import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDB, cartCount, calcCart, brl, clearCart, whatsNumber, waLink, fmtDate, getDB } from '../store'
import { SITE, PH } from '../config'
import { Logo, WaIcon, JetArt, Toaster } from './ui'

const LINKS = [['/jet-skis', 'Jet Skis'], ['/experiencias', 'Experiências'], ['/como-funciona', 'Como funciona'], ['/locais', 'Locais'], ['/sobre', 'Sobre'], ['/contato', 'Contato']]

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
        <div className="flex between"><h3 style={{ margin: 0 }}>🛒 Minha Reserva</h3><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">✕</button></div>
        <div className="divider" />
        {!c.jet ? (
          <div className="empty"><div style={{ fontSize: 42 }}>🌊</div><p>Sua reserva está vazia.<br />Escolha um Jet Ski para começar.</p><button className="btn btn-primary" onClick={() => { onClose(); nav('/jet-skis') }}>Ver Jet Skis</button></div>
        ) : (
          <>
            <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/8' }}><JetArt hue={c.jet.hue} /></div>
            <div className="line" style={{ marginTop: 12 }}><span>🌊 <strong>{c.jet.marca} {c.jet.modelo}</strong><br /><small>{cart.duracao}h {cart.data ? `· ${fmtDate(cart.data)} ${cart.hora}` : '· data a definir'}</small></span><strong>{brl(c.base)}</strong></div>
            {c.itens.map((i) => <div className="line" key={i.nome}><span>{i.icon} {i.nome}</span><strong>{brl(i.preco)}</strong></div>)}
            {c.desconto > 0 && <div className="line"><span>🏷️ Cupom {c.coupon.codigo}</span><strong style={{ color: 'var(--success)' }}>-{brl(c.desconto)}</strong></div>}
            <div className="divider" />
            <div className="total"><span>Total</span><span>{brl(c.total)}</span></div>
            <small className="muted">+ caução devolvível de {brl(c.caucao)}</small>
            <div style={{ marginTop: 'auto', paddingTop: 20 }} className="stack">
              <button className="btn btn-primary btn-block" onClick={() => { onClose(); nav('/minha-reserva') }}>VER MINHA RESERVA</button>
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
          <div className="flex">
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Minha Reserva, ${n} itens`}>
              <span aria-hidden="true">🛒</span><span className="cart-label">Minha Reserva</span>
              {n > 0 && <span className="cart-count">{n}</span>}
            </button>
            <Link to={logged ? '/cliente' : '/login'} className="btn btn-primary btn-sm">{logged ? 'Minha conta' : 'Login'}</Link>
            <button className="burger" onClick={() => setMenu(!menu)} aria-label="Abrir menu" aria-expanded={menu}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        <nav className={'mobile-menu ' + (menu ? 'open' : '')} aria-label="Menu mobile">
          {LINKS.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}
          <NavLink to="/minha-reserva">🛒 Minha Reserva {n > 0 && `(${n})`}</NavLink>
        </nav>
      </header>
      <MiniCart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div><Logo /><p style={{ marginTop: 16, maxWidth: 320 }}>Locação de Jet Skis em Goiás. {SITE.slogan}</p>
            <p className="small muted">{SITE.instagram || PH('REDES SOCIAIS')}</p></div>
          <div className="stack"><h4>Navegação</h4>{LINKS.map(([to, l]) => <div key={to}><Link to={to}>{l}</Link></div>)}</div>
          <div className="stack"><h4>Sua conta</h4><div><Link to="/minha-reserva">Minha Reserva</Link></div><div><Link to="/login">Login</Link></div><div><Link to="/cadastro">Criar conta</Link></div><div><Link to="/cliente">Área do cliente</Link></div><div><Link to="/admin">Painel administrativo</Link></div></div>
          <div className="stack"><h4>Contato</h4>
            <div className="small">📍 {SITE.endereco || PH('ENDEREÇO')}</div>
            <div className="small">📞 {SITE.telefone || PH('TELEFONE')}</div>
            <div className="small">💬 {SITE.whatsapp || PH('WHATSAPP')}</div>
            <div className="small">🕒 {SITE.horario || PH('HORÁRIOS')}</div>
          </div>
        </div>
        <div className="divider" style={{ margin: '40px 0 20px' }} />
        <div className="flex between wrap small muted"><span>© {new Date().getFullYear()} Loca Jett Oficial · Goiás — GO · CNPJ {SITE.cnpj || PH('CNPJ')}</span><span>Seus dados são tratados conforme a LGPD.</span></div>
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
      <a className="wa-float" href={waLink(num, 'Olá! Vim pelo site da Loca Jett Oficial e quero informações sobre locação de Jet Ski.')} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><WaIcon /></a>
      {db.settings.demo && !hideDemo && <div className="demo-banner"><button onClick={() => setHideDemo(true)} aria-label="Fechar aviso" style={{ float: 'right', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', marginLeft: 8 }}>✕</button>⚠️ Modo demonstração: Jet Skis, preços e locais são exemplos. Edite tudo em <Link to="/admin" style={{ textDecoration: 'underline' }}>/admin</Link>.</div>}
      <Toaster />
    </>
  )
}

export const PageHead = ({ eyebrow, title, text }) => (
  <section className="page-head"><div className="container"><span className="eyebrow">{eyebrow}</span><h1 style={{ fontSize: 'clamp(2rem,4.5vw,3.4rem)' }}>{title}</h1>{text && <p style={{ maxWidth: 640, fontSize: '1.1rem' }}>{text}</p>}</div></section>
)
export const openCart = () => window.dispatchEvent(new Event('open-cart'))
export const _db = getDB
