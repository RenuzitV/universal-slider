// src/pages/api/images/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { saveImageBase64 } from "../../../lib/poiStore";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  const { contentType, dataBase64 } = req.body as { contentType?: string; dataBase64?: string };
  if (!contentType || !dataBase64) return res.status(400).json({ error: "contentType and dataBase64 required" });

  const id = saveImageBase64(contentType, dataBase64);
  // alias path uses singular "image" as you asked:
  const url = `/api/image/${id}`;
  return res.status(201).json({ id, url });
}
