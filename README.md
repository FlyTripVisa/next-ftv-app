next-ftv-app/
├── .vscode/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Streaming AI endpoint
│   │   │   └── tools/
│   │   │       └── route.ts          # File operations endpoint
│   │   ├── chat/
│   │   │   └── page.tsx              # Real-time chat UI
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Redirects to /chat
│   ├── lib/
│   │   └── cloudflare.ts             # Cloudflare context helper
│   └── types/
│       ├── chat.ts                   # Chat types
│       └── file-ops.ts               # File operation types
├── public/
│   ├── _headers
│   └── [assets]
├── .env.local
├── .gitignore
├── env.d.ts
├── eslint.config.mjs
├── next.config.ts
├── open-next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── wrangler.jsonc
