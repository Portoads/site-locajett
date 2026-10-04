import { loadDB, saveDB, send, readBody, sign, authUser, hashPass, rateLimit, sendMail } from './_lib.js'

const MERGE = ['reservations', 'clients', 'notifications']
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' })
  try {
    const b = await readBody(req)
    const db = await loadDB()
    if (b.action === 'login') {
      if (!rateLimit(req, 'login', 8)) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' })
      const u = db.users.find((x) => x.ativo && x.email.toLowerCase() === String(b.email || '').trim().toLowerCase())
      if (!u || u.senhaHash !== hashPass(b.senha || '')) return send(res, 401, { error: 'Credenciais inválidas' })
      return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 12 * 3600e3 }), user: { id: u.id, nome: u.nome, papel: u.papel, email: u.email } })
    }
    const user = authUser(req, db)
    if (!user) return send(res, 401, { error: 'Sessão expirada. Entre novamente.' })
    const out = () => ({ ...db, users: db.users.map(({ senhaHash, ...u }) => u) })
    if (b.action === 'get') return send(res, 200, { db: out(), me: user.id })
    if (b.action === 'save') {
      const inc = b.db || {}
      const isOwner = user.papel === 'proprietario'
      for (const [k, v] of Object.entries(inc)) {
        if (k.startsWith('_') || (!Array.isArray(v) && k !== 'settings')) continue
        if (k === 'users') {
          if (!isOwner) continue
          db.users = v.map((u) => { const old = db.users.find((x) => x.id === u.id); const n = { ...u }; if (!n.senha && old?.senhaHash) n.senhaHash = old.senhaHash; return n })
          if (!db.users.some((u) => u.papel === 'proprietario' && u.ativo)) return send(res, 400, { error: 'Mantenha ao menos um proprietário ativo.' })
          continue
        }
        if (k === 'settings') { db.settings = { ...db.settings, ...v }; continue }
        if (MERGE.includes(k)) {
          const ids = new Set(v.map((x) => x.id))
          const removed = new Set(inc['_removed_' + k] || [])
          db[k] = [...v, ...(db[k] || []).filter((x) => !ids.has(x.id) && !removed.has(x.id))]
          continue
        }
        db[k] = v
      }
      await saveDB(db)
      return send(res, 200, { ok: true, db: out() })
    }
    if (b.action === 'testmail') {
      const r = await sendMail({ to: db.settings.adminEmail || process.env.ADMIN_EMAIL, subject: 'Teste — notificações Loca Jett Oficial', html: '<p>As notificações de novas reservas estão funcionando ✅</p>', text: 'As notificações de novas reservas estão funcionando.' })
      return send(res, 200, r)
    }
    send(res, 400, { error: 'Ação inválida' })
  } catch (e) { send(res, e.status || 500, { error: e.message }) }
}
