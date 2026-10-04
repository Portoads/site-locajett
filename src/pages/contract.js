import { brl, fmtDate } from '../store'
import { SITE, PH } from '../config'

export const contractText = (db, reservaId) => {
  const r = db.reservations.find((x) => x.id === reservaId)
  if (!r) return ''
  const c = db.clients.find((x) => x.id === r.clientId) || {}
  const j = db.jetskis.find((x) => x.id === r.jetId) || {}
  const l = db.locations.find((x) => x.id === r.localId) || {}
  const k = db.contracts.find((x) => x.reservaId === reservaId) || {}
  return `CONTRATO DE LOCAÇÃO DE JET SKI — Reserva nº ${r.id}

LOCADORA: ${SITE.nome}, CNPJ ${SITE.cnpj || PH('CNPJ')}, ${db.settings?.endereco || PH('ENDEREÇO')}.
LOCATÁRIO(A): ${c.nome || '-'}, CPF ${c.cpf || '-'}, e-mail ${c.email || '-'}, telefone ${c.telefone || '-'}, ${c.cidade || ''}/${c.estado || ''}.

1. OBJETO
Locação do Jet Ski ${j.marca} ${j.modelo} (${j.ano}), identificação ${j.identificacao}${j.capacidade ? ', capacidade ' + j.capacidade + ' pessoas' : ''}.

2. PERÍODO E LOCAL
Início: ${fmtDate(r.data)} · Término: ${fmtDate(r.dataFim)} · Diárias: ${r.diarias} · Pessoas: ${r.pessoas || '-'}
Local de embarque: ${l.nome || '-'}

3. VALORES
Locação: ${brl(r.subtotal)} · Adicionais: ${brl(r.adicionais)} · Desconto: ${brl(r.desconto)} · Taxas: ${brl(r.taxas)}
TOTAL: ${brl(r.total)}
Entrada (${r.entradaPct ?? 50}%): ${brl(r.entrada)} · Restante: ${brl(r.restante)} · Forma de pagamento: ${r.formaPagamento === 'cartao' ? 'Cartão' : 'Pix'}
Caução (devolvível após vistoria): ${brl(r.caucao)}

4. OBRIGAÇÕES DO LOCATÁRIO
a) Utilizar colete salva-vidas durante todo o período; b) respeitar a área de navegação indicada;
c) não pilotar sob efeito de álcool ou substâncias; d) possuir habilitação de Motonauta quando exigido e ter 18 anos ou mais;
e) responder por danos causados por mau uso, podendo a caução ser retida proporcionalmente.

5. CANCELAMENTO
${db.settings?.cancelamento || PH('POLÍTICA DE CANCELAMENTO E REMARCAÇÃO')}

6. CONDIÇÕES CLIMÁTICAS
${db.settings?.chuva || 'Em caso de condições climáticas que comprometam a segurança, a locação poderá ser remarcada.'}

7. DADOS PESSOAIS (LGPD)
Os dados do locatário são utilizados exclusivamente para execução deste contrato.

${PH('TERMOS ADICIONAIS DA EMPRESA')}

Assinatura do locatário: ${k.assinadoCliente ? 'Assinado digitalmente em ' + new Date(k.assinadoCliente).toLocaleString('pt-BR') : '____________________'}
Assinatura da locadora: ${k.criado ? 'Emitido em ' + new Date(k.criado).toLocaleString('pt-BR') : '____________________'}
`
}
