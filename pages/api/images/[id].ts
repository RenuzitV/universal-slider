// src/pages/api/images/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { readImageById } from "../../../lib/poiStore";
export const config = { api: { responseLimit: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const blob = readImageById(id);
  if (!blob) return res.status(404).end();
  res.setHeader("Content-Type", blob.contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.status(200).send(blob.data);
}
