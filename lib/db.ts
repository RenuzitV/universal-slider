import { neon } from "@netlify/neon";

const URL =
  process.env.NETLIFY_DATABSE_URL || // tolerate the typo you mentioned
  process.env.NETLIFY_DATABASE_URL ||
  "";

if (!URL) throw new Error("Missing NETLIFY_DATABSE_URL / NETLIFY_DATABASE_URL");

export const sql = neon(URL);
