// src/pages/api/pois/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPOI, updatePOI, deletePOI } from "../../../lib/poiStore";
import type { UpdatePOIInput } from "../../../types/poi";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const poi = getPOI(id); return poi ? res.status(200).json(poi) : res.status(404).json({ error: "not found" });
  }
  if (req.method === "PUT") {
    const patch = req.body as UpdatePOIInput;
    const updated = updatePOI(id, patch);
    return updated ? res.status(200).json(updated) : res.status(404).json({ error: "not found" });
  }
  if (req.method === "DELETE") {
    const ok = deletePOI(id); return res.status(ok ? 204 : 404).end();
  }

  res.setHeader("Allow", "GET,PUT,DELETE");
  res.status(405).end("Method Not Allowed");
}
