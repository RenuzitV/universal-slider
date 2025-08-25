// src/pages/api/pois/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPOI, deletePOI, upsertPOI } from "../../../lib/poiStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).end();

  if (req.method === "GET") {
    const poi = await getPOI(id);
    if (!poi) return res.status(404).end();
    return res.status(200).json(poi);
  }

  if (req.method === "PUT") {
    const b = req.body;
    const saved = await upsertPOI({
      id,
      title: b.title,
      description: b.description ?? "",
      date: new Date(b.date),
      imageURLs: Array.isArray(b.imageURLs) ? b.imageURLs : [],
    });
    return res.status(200).json(saved);
  }

  if (req.method === "DELETE") {
    await deletePOI(id);
    return res.status(204).end();
  }

  return res.status(405).end();
}
