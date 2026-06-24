/// <reference types="next" />
/// <reference types="@cloudflare/workers-types" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_NAME: string;
  }
}

interface CloudflareEnv {
  AI: import("@cloudflare/ai").Ai;
  ASSETS: { fetch: typeof fetch };
}
