# JeevanBindu client

React 18 + TypeScript + Vite + Tailwind + shadcn/ui. Talks to the Express API (`VITE_API_URL`).
The client holds no blockchain keys and does not talk to the chain directly; it displays the
blockchain records the server returns (status, transaction hash, block, explorer link).

```bash
cp .env.example .env
npm install
npm run dev      # http://localhost:8080
npm run build
```
