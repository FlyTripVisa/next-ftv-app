import { getCloudflareContext } from "@opennextjs/cloudflare";

// কনটেক্সট ক্যাশ করার জন্য একটি ভেরিয়েবল
let cachedContext: any = null;

async function getCtx() {
  if (!cachedContext) {
    cachedContext = await getCloudflareContext({ async: true });
  }
  return cachedContext;
}

export async function getAI() {
  const ctx = await getCtx();
  return ctx.env.AI;
}

export async function getAssets() {
  const ctx = await getCtx();
  return ctx.env.ASSETS;
}
