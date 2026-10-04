import { loadDB, send, rateLimit } from './_lib.js'
import { couponValid } from '../src/shared.js'

export default async function handler(req, res) {
  if (!rateLimit(req, 'coupon', 20)) return send(res, 429, { error: 'Muitas tentativas, aguarde.' })
  try {
    const u = new URL(req.url, 'http://x')
    const code = String(u.searchParams.get('code') || '').trim().toUpperCase()
    const db = await loadDB()
    const c = (db.coupons || []).find((x) => x.codigo.toUpperCase() === code)
    const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10)
    if (!c || !couponValid(c, Number(u.searchParams.get('base')) || 0, u.searchParams.get('jet'), today)) return send(res, 200, { coupon: null })
    send(res, 200, { coupon: { codigo: c.codigo, tipo: c.tipo, valor: c.valor, minimo: c.minimo, validade: c.validade, jets: c.jets, jetsTxt: c.jetsTxt } })
  } catch (e) { send(res, e.status || 500, { error: e.message }) }
}
