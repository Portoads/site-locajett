import { useEffect, useRef, useState } from 'react'
import { STATUS, JET_STATUS } from '../store'

// Placeholder elegante (sem ilustração) quando o Jet Ski ainda não tem foto
export function JetArt({ className = '' }) {
  return (
    <div className={'jet-art ' + className} role="img" aria-label="Loca Jett Oficial" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 40%, #18202A, #0B0F14 70%)' }}>
      <img src="/img/logo.webp" alt="" style={{ width: '28%', minWidth: 64, opacity: .55, borderRadius: '50%' }} />
    </div>
  )
}

export function JetPhoto({ jet, i = 0, className = '', fit = 'cover' }) {
  const src = jet?.fotos?.[i] || jet?.fotos?.[0]
  if (!src) return <JetArt className={className} />
  return <img src={src} alt={`${jet.marca || ''} ${jet.modelo || ''}`.trim() || 'Jet Ski'} loading="lazy" className={'jet-art ' + className} style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: 'center top', background: '#0F1318' }} />
}

export function Logo({ size = 46, word = true }) {
  return (
    <span className="logo">
      <img src="/img/logo.webp" width={size} height={size} alt="" />
      {word && <span className="logo-word"><b>LOCA JETT</b><small>Oficial</small></span>}
    </span>
  )
}

// Ícones de traço fino (substituem emojis)
const P = {
  bag: 'M6 8h12l-1 12H7L6 8zm3 0V6a3 3 0 0 1 6 0v2',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 8h16M4 16h16',
  arrow: 'M4 12h15m-5-5l5 5-5 5',
  back: 'M20 12H5m5-5l-5 5 5 5',
  down: 'M12 4v15m-5-5l5 5 5-5',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4.5l3 2',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  insta: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm5.5-9.5h.01',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  check: 'M5 12l4 4 10-10',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
}
export const Icon = ({ name, size = 18, stroke = 1.4, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={P[name]} /></svg>
)

export const Badge = ({ status, map = STATUS, children }) => {
  const s = map[status] || { label: status, tone: 'muted' }
  return <span className={'badge tone-' + s.tone}>{children || s.label}</span>
}
export const JetBadge = ({ status }) => <Badge status={status} map={JET_STATUS} />

export function Modal({ open, onClose, title, children, width }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="overlay" onClick={onClose} />
      <div className="modal-box" style={width ? { width } : null}>
        <div className="flex between" style={{ marginBottom: 16 }}><h3 style={{ margin: 0 }}>{title}</h3><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar"><Icon name="close" size={14} /></button></div>
        {children}
      </div>
    </div>
  )
}

let toastSet
export const toast = (msg) => toastSet && toastSet(msg)
export function Toaster() {
  const [m, setM] = useState('')
  toastSet = (msg) => { setM(msg); clearTimeout(window.__lt); window.__lt = setTimeout(() => setM(''), 2800) }
  return m ? <div className="toast" role="status">{m}</div> : null
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el); return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={'reveal ' + className} style={{ transitionDelay: delay + 'ms' }} {...rest}>{children}</Tag>
}

export const Field = ({ label, error, children, id }) => (
  <div className="field"><label htmlFor={id}>{label}</label>{children}{error && <span className="err-msg" role="alert">{error}</span>}</div>
)

export const WaIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.1c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1.3 1.3-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.3 9.8 10.1 5 16 5s10.7 4.8 10.7 10.6S21.9 26.1 16 26.1zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" /></svg>
)
