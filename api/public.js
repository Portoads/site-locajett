import { loadDB, send } from './_lib.js'
import { PUBLIC_TABLES, PUBLIC_SETTINGS } from '../src/shared.js'

export default async function handler(req, res) {
  try {
    const db = await loadDB()
    const tables = Object.fromEntries(PUBLIC_TABLES.map((t) => [t, db[t] || []]))
    tables.promos = (db.coupons || []).filter((c) => c.ativo && c.imagem).map((c) => ({ id: c.id, imagem: c.imagem, valor: c.valor, tipo: c.tipo, validadeDias: c.validadeDias, ativo: true, codigo: '' }))
    const settings = Object.fromEntries(PUBLIC_SETTINGS.map((k) => [k, db.settings[k]]))
    const busy = (db.reservations || []).filter((r) => r.status !== 'cancelada').map((r) => ({ id: 'b' + r.id.slice(-4) + r.data, jetId: r.jetId, data: r.data, dataFim: r.dataFim, status: r.status }))
    res.setHeader('cache-control', 'no-store')
    send(res, 200, { ok: true, tables, settings, busy })
  } catch (e) { send(res, e.status || 500, { ok: false, error: e.message }) }
}
