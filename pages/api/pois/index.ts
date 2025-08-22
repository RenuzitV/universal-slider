// src/pages/api/pois/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listPOIs, createPOI } from "../../../lib/poiStore";
import type { CreatePOIInput } from "../../../types/poi";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return res.status(200).json(listPOIs());

  if (req.method === "POST") {
    const body = req.body as CreatePOIInput;
    if (!body?.title || !body?.date) {
      return res.status(400).json({ error: "title and date (ISO) are required" });
    }
    const created = createPOI({
      ...body,
      imageURLs: body.imageURLs ?? [],
    });
    return res.status(201).json(created);
  }

  res.setHeader("Allow", "GET,POST");
  res.status(405).end("Method Not Allowed");
}
