/// <reference types="@cloudflare/workers-types" />

interface Env {
  AI: any;
  DB: D1Database;
  KV_BINDING: KVNamespace;
  PROJECT_FILES: R2Bucket;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_API_TOKEN: string;
  }
}