import { get, put } from '@vercel/blob'
import crypto from 'node:crypto'
import { seedDB, DEFAULT_SETTINGS } from '../src/shared.js'

const PATH = 'locajett/db.json'
import fs from 'node:fs'
const LOCAL = process.env.LOCAL_DB_FILE // só para desenvolvimento/testes
export const hasStore = () => !!(LOCAL || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

export const hashPass = (s) => 'h1$' + crypto.createHash('sha256').update('locajett:' + String(s)).digest('hex')
const normalizeUsers = (users = []) => users.map((u) => {
  const x = { ...u }
  if (x.senha) { x.senhaHash = hashPass(x.senha); delete x.senha }
  return x
})

export async function loadDB() {
  if (!hasStore()) throw Object.assign(new Error('Armazenamento não configurado'), { status: 503 })
  let data = null
  if (LOCAL) { try { data = JSON.parse(fs.readFileSync(LOCAL, 'utf8')) } catch {} } else try {
    const r = await get(PATH, { access: 'private', useCache: false })
    if (r) data = JSON.parse(await new Response(r.stream).text())
  } catch (e) { if (!/not.?found/i.test(String(e?.name) + String(e?.message))) throw e }
  if (!data) {
    data = seedDB()
    if (process.env.ADMIN_PASSWORD) data.users[0].senha = process.env.ADMIN_PASSWORD
    if (process.env.ADMIN_EMAIL) data.settings.adminEmail = process.env.ADMIN_EMAIL
    data.users = normalizeUsers(data.users)
    await saveDB(data)
  }
  data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) }
  return data
}
export async function saveDB(data) {
  data.users = normalizeUsers(data.users)
  data.updatedAt = new Date().toISOString()
  if (LOCAL) return fs.writeFileSync(LOCAL, JSON.stringify(data))
  await put(PATH, JSON.stringify(data), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 })
}

const SECRET = () => process.env.ADMIN_SECRET || process.env.BLOB_READ_WRITE_TOKEN || 'dev-secret'
export const sign = (obj) => { const p = Buffer.from(JSON.stringify(obj)).toString('base64url'); return p + '.' + crypto.createHmac('sha256', SECRET()).update(p).digest('base64url') }
export const verify = (tok) => {
  if (!tok) return null
  const [p, s] = tok.split('.')
  if (!p || !s) return null
  const exp = crypto.createHmac('sha256', SECRET()).update(p).digest('base64url')
  if (s.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(exp))) return null
  const o = JSON.parse(Buffer.from(p, 'base64url').toString())
  return o.exp > Date.now() ? o : null
}
export const authUser = (req, data) => {
  const t = verify(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''))
  return t && data.users.find((u) => u.id === t.uid && u.ativo)
}

export const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  let s = ''; for await (const c of req) s += c
  try { return JSON.parse(s || '{}') } catch { return {} }
}
export const send = (res, status, obj) => { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(obj)) }

// Limite simples por IP (por instância)
const hits = new Map()
export const rateLimit = (req, key, max = 10, windowMs = 60000) => {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x'
  const k = key + ':' + ip, now = Date.now()
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs)
  arr.push(now); hits.set(k, arr)
  return arr.length <= max
}

export async function sendMail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return { sent: false, reason: !key ? 'RESEND_API_KEY não configurada' : 'e-mail do administrador não definido' }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM || 'Loca Jett Oficial <onboarding@resend.dev>', to: String(to).split(',').map((s) => s.trim()).filter(Boolean), subject, html, text }),
  })
  return { sent: r.ok, reason: r.ok ? '' : await r.text() }
}
