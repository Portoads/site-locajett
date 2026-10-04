import { useEffect, useId, useRef, useState } from 'react'
import { STATUS, JET_STATUS } from '../store'

export function JetArt({ hue = 200, className = '', scene = true }) {
  const id = 'g' + useId().replace(/:/g, '')
  return (
    <svg className={'jet-art ' + className} viewBox="0 0 640 400" role="img" aria-label="Ilustração de Jet Ski na água" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A2A55" /><stop offset=".55" stopColor="#1E5C8A" /><stop offset="1" stopColor="#FF9B5A" /></linearGradient>
        <linearGradient id={id + 'sea'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0F6D99" /><stop offset="1" stopColor="#03203D" /></linearGradient>
        <linearGradient id={id + 'body'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`hsl(${hue} 95% 62%)`} /><stop offset="1" stopColor={`hsl(${hue + 20} 90% 38%)`} /></linearGradient>
        <linearGradient id={id + 'hull'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5FAFF" /><stop offset="1" stopColor="#AFC4DA" /></linearGradient>
      </defs>
      {scene && <>
        <rect width="640" height="400" fill={`url(#${id}sky)`} />
        <circle cx="500" cy="190" r="60" fill="#FFD08A" opacity=".9" />
        <path d="M0 215 Q80 195 160 210 T320 205 T480 212 T640 205 V400 H0Z" fill="#1A4E6E" opacity=".7" />
        <rect y="230" width="640" height="170" fill={`url(#${id}sea)`} />
        <path d="M0 240 H640" stroke="#FFC98A" strokeOpacity=".5" strokeWidth="2" />
        <g stroke="#9FDBFF" strokeOpacity=".35" strokeWidth="2" fill="none">
          <path d="M30 300 q20 -8 40 0 t40 0" /><path d="M420 330 q20 -8 40 0 t40 0" /><path d="M520 280 q15 -6 30 0 t30 0" />
        </g>
      </>}
      <g transform="translate(110 150)">
        <path d="M-60 170 Q60 150 160 165 T400 160" stroke="#E8F7FF" strokeOpacity=".6" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M-90 185 Q-30 160 10 172" stroke="#E8F7FF" strokeOpacity=".45" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M20 140 L380 140 Q420 140 430 118 L405 112 L60 118 Q30 120 20 140Z" fill={`url(#${id}hull)`} />
        <path d="M60 118 L405 112 Q395 70 330 60 L250 58 Q200 40 150 52 L90 70 Q55 85 60 118Z" fill={`url(#${id}body)`} />
        <path d="M150 52 Q205 36 255 58 L240 70 Q190 58 150 66Z" fill="#06213D" />
        <path d="M240 70 L330 64 Q370 66 385 95 L250 98Z" fill="#0B2E50" opacity=".85" />
        <path d="M118 46 L150 18 L168 22 L146 52Z" fill="#0A1C30" />
        <rect x="128" y="12" width="70" height="10" rx="5" fill="#0A1C30" transform="rotate(-8 160 18)" />
        <path d="M300 92 L400 90" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 100 L220 96" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
        <text x="200" y="132" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="16" fill="#0A1C30" letterSpacing="4">LOCA JETT</text>
      </g>
    </svg>
  )
}

export function JetPhoto({ jet, i = 0, className = '', fit = 'cover' }) {
  const src = jet?.fotos?.[i] || jet?.fotos?.[0]
  if (!src) return <JetArt hue={jet?.hue ?? 200} className={className} />
  return <img src={src} alt={`${jet.marca || ''} ${jet.modelo || ''}`.trim() || 'Jet Ski'} loading="lazy" className={'jet-art ' + className} style={{ width: '100%', height: '100%', objectFit: fit, background: '#E9EEF2' }} />
}

export function Logo({ size = 38 }) {
  const lg = 'lg' + useId().replace(/:/g, '')
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id={lg} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00C2FF" /><stop offset="1" stopColor="#0057FF" /></linearGradient></defs><rect width="64" height="64" rx="16" fill="#0B2440" stroke="rgba(148,197,255,.25)" /><path d="M10 42c8 0 10-6 18-6s10 6 18 6 6-3 8-3" stroke={`url(#${lg})`} strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M16 31l10-12h12l8 8-6 4H16z" fill={`url(#${lg})`} /><circle cx="48" cy="16" r="5" fill="#FFB547" /></svg>
      <span>LOCA JETT<small>OFICIAL</small></span>
    </span>
  )
}

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
        <div className="flex between" style={{ marginBottom: 16 }}><h3 style={{ margin: 0 }}>{title}</h3><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">✕</button></div>
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
  <svg width={size} height={size} viewBox="0 0 32 32" fill="#fff" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.1c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1.3 1.3-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.3 9.8 10.1 5 16 5s10.7 4.8 10.7 10.6S21.9 26.1 16 26.1zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" /></svg>
)
