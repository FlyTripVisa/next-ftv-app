// env.d.ts
// TypeScript definitions for environment variables

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_CF_TOKEN: string;        // Cloudflare API token (public)
    CLOUDFLARE_ACCOUNT_ID: string;       // Cloudflare account ID
    NEXT_PUBLIC_HF_TOKEN?: string;       // Optional Hugging Face token
    NODE_ENV: "development" | "production" | "test";
  }
}
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_CF_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    NEXT_PUBLIC_HF_TOKEN?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}

