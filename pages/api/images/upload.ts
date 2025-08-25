import type { NextApiRequest, NextApiResponse } from "next";
import { putImage } from "../../../lib/poiStore";

export const config = {
  api: { bodyParser: { sizeLimit: "16mb" } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { contentType, data, filename, width, height, id } = req.body || {};
    if (!contentType || !data) return res.status(400).json({ error: "Missing contentType/data" });

    // accept client id or make one
    const imgId = id || crypto.randomUUID();

    // decode base64 -> bytes
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));

    const saved = await putImage({
      id: imgId,
      contentType,
      data: bytes,
      width: typeof width === "number" ? width : undefined,
      height: typeof height === "number" ? height : undefined,
    });

    res.status(200).json(saved); // { id, url }
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "upload failed" });
  }
}

// tiny atob polyfill for Node < 16.7
function atob(b64: string) {
  return Buffer.from(b64, "base64").toString("binary");
}
