import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getAI() {
  const ctx = await getCloudflareContext({ async: true });
  return ctx.env.AI;
}

export async function getAssets() {
  const ctx = await getCloudflareContext({ async: true });
  return ctx.env.ASSETS;
}
