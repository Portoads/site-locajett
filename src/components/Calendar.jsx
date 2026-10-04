import { useState } from 'react'
import { dayState, today, useDB } from '../store'

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function Calendar({ jetId, value, onChange }) {
  useDB()
  const t = new Date()
  const [ym, setYm] = useState(() => { const d = value ? new Date(value + 'T12:00') : t; return [d.getFullYear(), d.getMonth()] })
  const [y, m] = ym
  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const label = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const move = (k) => { const d = new Date(y, m + k, 1); setYm([d.getFullYear(), d.getMonth()]) }
  const canPrev = y > t.getFullYear() || m > t.getMonth()
  return (
    <div className="cal">
      <div className="flex between" style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(-1)} disabled={!canPrev} aria-label="Mês anterior">‹</button>
        <strong style={{ textTransform: 'capitalize' }}>{label}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(1)} aria-label="Próximo mês">›</button>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {Array.from({ length: first }).map((_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const date = iso(y, m, i + 1)
          const st = jetId ? dayState(jetId, date) : date < today() ? 'indisponivel' : 'disponivel'
          const ok = st === 'disponivel' || st === 'em_uso'
          return <button type="button" key={date} className={`cal-day ${st} ${value === date ? 'sel' : ''}`} disabled={!ok} onClick={() => onChange(date)} aria-label={`${i + 1} — ${st}`} aria-pressed={value === date}>{i + 1}</button>
        })}
      </div>
      <div className="cal-legend">
        <span><i style={{ background: 'var(--success)' }} />Disponível</span><span><i style={{ background: 'var(--warning)' }} />Reservado</span>
        <span><i style={{ background: 'var(--primary)' }} />Em uso</span><span><i style={{ background: 'var(--danger)' }} />Manutenção</span><span><i style={{ background: 'var(--text-muted)' }} />Indisponível</span>
      </div>
    </div>
  )
}
