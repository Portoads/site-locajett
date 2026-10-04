# Loca Jett Oficial — Plataforma de Locação de Jet Skis (Goiás)

Site público + reservas + 🛒 Minha Reserva + finalização pelo WhatsApp + área do cliente + painel administrativo.

- **Stack:** React 18 + Vite + React Router (SPA), CSS com design tokens.
- **Rodar local:** `npm install && npm run dev`
- **Build:** `npm run build` (saída em `dist/`) — publicado na Vercel.
- **Dados da empresa:** edite `src/config.js` (WhatsApp, telefone, endereço...).
- **Admin:** `/admin` — login de demonstração `admin@locajett.com` / `admin123` (troque em Usuários).
- **Especificação completa:** [`SPEC.mdx`](./SPEC.mdx).

> Modo demonstração: os dados ficam no navegador (localStorage). As reservas chegam à empresa pelo WhatsApp. Para banco central, veja SPEC.mdx §14.
