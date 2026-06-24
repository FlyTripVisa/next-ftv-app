import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch(
    "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-3-8b-instruct",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
