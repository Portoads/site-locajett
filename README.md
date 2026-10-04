# Loca Jett Oficial — Plataforma de Locação de Jet Skis (Goiás)

Site público + reservas + 🛒 Minha Reserva + finalização pelo WhatsApp + área do cliente + painel administrativo.

- **Stack:** React 18 + Vite + React Router (SPA), CSS com design tokens.
- **Rodar local:** `npm install && npm run dev`
- **Build:** `npm run build` (saída em `dist/`) — publicado na Vercel.
- **Dados da empresa:** edite `src/config.js` (WhatsApp, telefone, endereço...).
- **Admin:** `/admin` — login do proprietário `admin@locajett.com` (senha definida na variável ADMIN_PASSWORD da Vercel; troque em Usuários).
- **Especificação completa:** [`SPEC.mdx`](./SPEC.mdx).

> Dados centralizados no Vercel Blob via /api (ver SPEC.mdx §18). Sem a API (ex.: rodando local), o site entra em modo local com localStorage.
