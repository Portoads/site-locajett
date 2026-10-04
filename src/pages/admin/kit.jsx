import { useState } from 'react'
import { upsert, remove } from '../../store'
import { Modal, Field, toast } from '../../components/ui'

export function Bars({ data, fmt = (v) => v, height = 180 }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  const [hover, setHover] = useState(null)
  return (
    <div>
      <div className="bars" style={{ height, gap: 2 }} role="img" aria-label="Gráfico de barras">
        {data.map((d, i) => (
          <div key={i} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            style={{ height: `${(d.v / max) * 100}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: hover === null || hover === i ? 1 : 0.55 }}>
            {hover === i && <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%,-6px)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 8, fontSize: '.75rem', whiteSpace: 'nowrap', zIndex: 3 }}>{d.l}: <strong>{fmt(d.v)}</strong></span>}
          </div>
        ))}
      </div>
      <div className="bar-labels">{data.map((d, i) => <span key={i}>{d.l}</span>)}</div>
    </div>
  )
}

export function HBars({ data, fmt = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  return <div className="stack">{data.map((d) => <div key={d.l}><div className="flex between small"><span>{d.l}</span><strong>{fmt(d.v)}</strong></div><div className="hbar"><i style={{ width: (d.v / max) * 100 + '%', background: 'var(--primary)' }} /></div></div>)}</div>
}

// CRUD genérico: fields = [{k, l, type: text|number|select|textarea|date|checkbox|list, options, req}]
export function Crud({ table, rows, cols, fields, title, newItem = {}, actions, canDelete = true, searchKeys = [] }) {
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')
  const list = q ? rows.filter((r) => searchKeys.some((k) => String(r[k] || '').toLowerCase().includes(q.toLowerCase()))) : rows
  const save = (e) => {
    e.preventDefault()
    const miss = fields.find((f) => f.req && (edit[f.k] === '' || edit[f.k] == null))
    if (miss) return toast(`Preencha: ${miss.l}`)
    const item = { ...edit }
    fields.forEach((f) => { if (f.type === 'number') item[f.k] = Number(item[f.k]) || 0; if (f.type === 'list' && typeof item[f.k] === 'string') item[f.k] = item[f.k].split('\n').map((s) => s.trim()).filter(Boolean) })
    upsert(table, item); toast('Salvo ✓'); setEdit(null)
  }
  return (
    <div className="card">
      <div className="flex between wrap" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{title} <small className="muted">({rows.length})</small></h3>
        <div className="flex wrap">{searchKeys.length > 0 && <input className="input" style={{ width: 220 }} placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />}<button className="btn btn-primary btn-sm" onClick={() => setEdit({ ...newItem })}>+ Novo</button></div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr>{cols.map((c) => <th key={c.l}>{c.l}</th>)}<th>Ações</th></tr></thead>
        <tbody>{list.length ? list.map((r) => <tr key={r.id}>{cols.map((c) => <td key={c.l}>{c.r ? c.r(r) : r[c.k]}</td>)}
          <td><div className="flex">{actions && actions(r)}<button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...r, ...Object.fromEntries(fields.filter((f) => f.type === 'list').map((f) => [f.k, (r[f.k] || []).join('\n')])) })}>Editar</button>{canDelete && <button className="btn btn-danger btn-sm" onClick={() => confirm('Excluir este registro?') && (remove(table, r.id), toast('Excluído'))}>Excluir</button>}</div></td></tr>)
          : <tr><td colSpan={cols.length + 1} className="empty">Nenhum registro.</td></tr>}</tbody>
      </table></div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar' : 'Novo registro'}>
        {edit && <form onSubmit={save} className="grid g2" style={{ gap: 14 }}>
          {fields.map((f) => (
            <div key={f.k} style={f.type === 'textarea' || f.type === 'list' ? { gridColumn: '1/-1' } : null}>
              <Field label={f.l + (f.req ? ' *' : '')} id={'cf-' + f.k}>
                {f.type === 'select' ? <select id={'cf-' + f.k} className="input" value={edit[f.k] ?? ''} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}><option value="">—</option>{f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                  : f.type === 'textarea' || f.type === 'list' ? <textarea id={'cf-' + f.k} rows={f.type === 'list' ? 4 : 3} className="input" placeholder={f.type === 'list' ? 'Um item por linha' : ''} value={edit[f.k] ?? ''} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} />
                  : f.type === 'checkbox' ? <input id={'cf-' + f.k} type="checkbox" checked={!!edit[f.k]} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.checked })} />
                  : <input id={'cf-' + f.k} type={f.type || 'text'} className="input" value={edit[f.k] ?? ''} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} />}
              </Field>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }} className="flex"><button className="btn btn-primary">Salvar</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancelar</button></div>
        </form>}
      </Modal>
    </div>
  )
}
