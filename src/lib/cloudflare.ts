import { getRequestContext } from "@cloudflare/next-on-pages";

export function getCloudflareContext() {
  const ctx = getRequestContext();
  return {
    ai: ctx.env.AI,
    db: ctx.env.DB,
    kv: ctx.env.KV_BINDING,
    r2: ctx.env.PROJECT_FILES,
  };
}