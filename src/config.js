// ============================================================
//  EDITE AQUI — Dados oficiais da Loca Jett Oficial
//  Tudo que estiver vazio aparece no site como [INSERIR ...].
//  O WhatsApp também pode ser ajustado em /admin/configuracoes
//  (vale para o navegador do admin até existir um backend).
// ============================================================
export const SITE = {
  nome: 'Loca Jett Oficial',
  slogan: 'Sua próxima experiência começa na água.',
  regiao: 'Goiás — GO',
  whatsapp: '5562981047747', // só números com DDI
  telefone: '(62) 98104-7747',
  email: '',
  endereco: '',
  instagram: '@locajetoficial',
  horario: '',
  cnpj: '',
}

// Campos vazios não aparecem mais como "[INSERIR ...]" para o público
export const PH = () => ''
// Remove marcadores tipo [INSERIR ENDEREÇO] / [A DEFINIR] vindos do painel
export const clean = (t) => (t || '').replace(/[^.!?]*\[(INSERIR|A DEFINIR)[^\]]*\][^.!?]*[.!?]?/gi, '').replace(/\s{2,}/g, ' ').trim()

// Fotografias de ambientação (Unsplash — licença gratuita). Troque pelas fotos oficiais quando tiver.
const U = (id, w = 2000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`
export const PHOTOS = {
  hero: U('photo-1618857320928-e53d9fee12fe', 2400),
  sunset: U('photo-1623430704782-03ba89371ea3'),
  action: U('photo-1593355765170-4c7c31013922', 1600),
}
