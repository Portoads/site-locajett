import { loadDB, saveDB, send, readBody, rateLimit, sendMail } from './_lib.js'
import { conflicts, calcPrice, couponValid, rangeEnd, genCode, buildAdminEmail } from '../src/shared.js'

const clean = (s, n = 200) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n)
const validCPF = (v) => {
  const c = String(v || '').replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  const calc = (n) => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return calc(9) === +c[9] && calc(10) === +c[10]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' })
  if (!rateLimit(req, 'reserve', 6)) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' })
  try {
    const b = await readBody(req)
    const db = await loadDB()
    const s = db.settings
    const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10)
    const jet = db.jetskis.find((j) => j.id === b.jetId)
    const diarias = Math.floor(Number(b.diarias))
    const c = b.cliente || {}
    const errs = []
    if (!jet || ['manutencao', 'indisponivel'].includes(jet.status)) errs.push('Jet Ski indisponível')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '') || b.data < today) errs.push('Data inválida')
    if (!(diarias >= 1 && diarias <= (Number(s.diariasMax) || 15))) errs.push('Quantidade de diárias inválida')
    if (!['pix', 'cartao'].includes(b.formaPagamento)) errs.push('Forma de pagamento inválida')
    if (clean(c.nome).split(' ').length < 2) errs.push('Nome inválido')
    if (!/^\S+@\S+\.\S+$/.test(c.email || '')) errs.push('E-mail inválido')
    if (String(c.telefone || '').replace(/\D/g, '').length < 10) errs.push('Telefone inválido')
    if (!validCPF(c.cpf)) errs.push('CPF inválido')
    const age = c.nascimento ? (Date.now() - new Date(c.nascimento)) / 31557600000 : 0
    if (age < (Number(s.idadeMinima) || 18)) errs.push(`Idade mínima de ${s.idadeMinima || 18} anos`)
    if (errs.length) return send(res, 400, { error: errs.join('. ') })

    const conflict = conflicts({ ranges: db.reservations, bloqueios: db.bloqueios }, jet.id, b.data, diarias)
    if (conflict) return send(res, 409, { error: 'Este Jet Ski já está reservado ou bloqueado em parte desse período. Escolha outra data.' })

    const services = db.services.filter((x) => x.ativo && (b.servicos || []).includes(x.id))
    const exp = db.experiences.find((e) => e.id === b.experienciaId && e.ativo)
    const pre = calcPrice({ jet, diarias, services, experience: exp, settings: s })
    const cp = (db.coupons || []).find((x) => x.codigo.toUpperCase() === String(b.cupom || '').trim().toUpperCase())
    const coupon = couponValid(cp, pre.base + pre.adicionais, jet.id, today) ? cp : null
    const p = calcPrice({ jet, diarias, services, experience: exp, coupon, settings: s })

    let client = db.clients.find((x) => x.email.toLowerCase() === String(c.email).toLowerCase())
    const data = { nome: clean(c.nome), cpf: clean(c.cpf, 20), telefone: clean(c.telefone, 30), whatsapp: '55' + String(c.telefone).replace(/\D/g, ''), email: clean(c.email, 120), nascimento: clean(c.nascimento, 10), endereco: clean(c.endereco), cidade: clean(c.cidade, 80), estado: clean(c.estado, 2), cep: clean(c.cep, 12) }
    if (client) Object.assign(client, data)
    else { client = { id: 'c' + Date.now().toString(36), ...data, status: 'ativo', createdAt: today, pontos: 0, refCode: 'AMIGO-' + Math.random().toString(36).slice(2, 7).toUpperCase() }; db.clients.push(client) }
    if (client.status === 'bloqueado') return send(res, 403, { error: 'Não foi possível concluir. Fale com a Loca Jett pelo WhatsApp.' })

    const r = {
      id: genCode((x) => db.reservations.some((y) => y.id === x)), clientId: client.id, jetId: jet.id, data: b.data, diarias, dataFim: rangeEnd(b.data, diarias),
      pessoas: Math.max(1, Math.min(10, Number(b.pessoas) || 1)), localId: clean(b.localId, 20) || 'l1', servicos: services.map((x) => x.id), experienciaId: exp?.id || 'e1',
      subtotal: p.base, adicionais: p.adicionais, desconto: p.desconto, taxas: p.taxas, caucao: p.caucao, total: p.total, entrada: p.entrada, restante: p.restante, entradaPct: p.entradaPct,
      formaPagamento: b.formaPagamento, cupom: coupon?.codigo || '', status: 'aguardando_atendimento', pagamento: 'pendente', obs: clean(b.obs, 600), createdAt: new Date().toISOString(),
    }
    db.reservations.push(r)
    if (coupon) coupon.usos = (coupon.usos || 0) + 1
    db.notifications = [{ id: 'n' + Date.now(), tipo: 'reserva', texto: `Nova reserva ${r.id} — ${client.nome} — ${jet.modelo} — ${r.diarias} diária(s) — entrada ${p.entrada.toFixed(2)}`, data: r.createdAt, lida: false }, ...(db.notifications || [])].slice(0, 300)
    await saveDB(db)

    const mail = buildAdminEmail({ ...r, statusLabel: 'Aguardando atendimento / pagamento da entrada' }, client, jet, s)
    const m = await sendMail({ to: s.adminEmail || process.env.ADMIN_EMAIL, ...mail }).catch((e) => ({ sent: false, reason: e.message }))
    send(res, 200, { ok: true, reservation: r, client: { ...client, cpf: undefined }, email: m.sent })
  } catch (e) { send(res, e.status || 500, { error: e.message }) }
}
