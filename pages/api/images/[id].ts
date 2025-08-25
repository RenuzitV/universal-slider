// src/pages/api/images/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getImage } from "../../../lib/poiStore";
export const config = { api: { responseLimit: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).end();

  const img = await getImage(id);
  if (!img) return res.status(404).end();

  res.setHeader("Content-Type", img.contentType || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(Buffer.from(img.data));
}
