// src/pages/api/pois/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listPOIs, upsertPOI } from "../../../lib/poiStore";
import type { CreatePOIInput } from "../../../types/poi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const pois = await listPOIs();
    return res.status(200).json(pois);
  }
  if (req.method === "POST") {
    const b = req.body;
    const saved = await upsertPOI({
      id: b.id, // client can choose id (e.g., "poi4"); else generate here.
      title: b.title,
      description: b.description ?? "",
      date: new Date(b.date),
      imageURLs: Array.isArray(b.imageURLs) ? b.imageURLs : [],
    });
    return res.status(200).json(saved);
  }
  return res.status(405).end();
}
