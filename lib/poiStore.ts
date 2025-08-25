import { sql } from "./db";

export type POI = {
  id: string;
  title: string;
  description: string;
  date: Date;            // exposed as Date in app
  imageURLs: string[];   // /api/image/:id
};

const rowToPOI = (r: any): POI => ({
  id: r.id,
  title: r.title,
  description: r.description,
  date: new Date(r.moment_date),
  imageURLs: r.image_ids?.length
    ? r.image_ids.map((id: string) => `/api/image/${id}`)
    : [],
});

export async function listPOIs(): Promise<POI[]> {
  const rows = await sql/*sql*/`
    select p.id, p.title, p.description, p.moment_date,
           coalesce(array_agg(i.id) filter (where i.id is not null), '{}') as image_ids
    from pois p
    left join poi_images i on i.poi_id = p.id
    group by p.id
    order by p.moment_date asc, p.id asc
  `;
  return rows.map(rowToPOI);
}

export async function getPOI(id: string): Promise<POI | null> {
  const rows = await sql/*sql*/`
    select p.id, p.title, p.description, p.moment_date,
           coalesce(array_agg(i.id) filter (where i.id is not null), '{}') as image_ids
    from pois p
    left join poi_images i on i.poi_id = p.id
    where p.id = ${id}
    group by p.id
    limit 1
  `;
  return rows.length ? rowToPOI(rows[0]) : null;
}

export type UpsertPOIInput = {
  id: string;
  title: string;
  description: string;
  date: Date;
  imageURLs: string[]; // /api/image/:id
};

export async function upsertPOI(input: UpsertPOIInput): Promise<POI> {
  // upsert main row
  await sql/*sql*/`
    insert into pois (id, title, description, moment_date, created_at, updated_at)
    values (${input.id}, ${input.title}, ${input.description}, ${input.date.toISOString()}, now(), now())
    on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          moment_date = excluded.moment_date,
          updated_at = now()
  `;

  // link images mentioned in payload (by parsing /api/image/:id)
  const ids = input.imageURLs
    .map(u => (u.match(/\/api\/image\/(.+)$/)?.[1]) || null)
    .filter(Boolean) as string[];

  if (ids.length) {
    // associate any uploaded images to this POI
    await sql/*sql*/`
      update poi_images set poi_id = ${input.id}
      where id = any(${ids})
    `;
  }

  // (optional) detach images that were previously linked but now removed:
  // await sql/*sql*/`
  //   update poi_images set poi_id = null
  //   where poi_id = ${input.id} and id != all(${ids})
  // `;

  const saved = await getPOI(input.id);
  if (!saved) throw new Error("Failed to load saved POI");
  return saved;
}

export async function deletePOI(id: string): Promise<void> {
  await sql/*sql*/`delete from pois where id = ${id}`;
}

export type NewImage = {
  id: string;                // generated on client (or server), returned to client
  contentType: string;
  data: Buffer | Uint8Array; // raw bytes
  width?: number;
  height?: number;
};

// Store raw image (standalone; poi_id can be set later on upsert)
export async function putImage(img: NewImage): Promise<{ id: string; url: string }> {
  await sql/*sql*/`
    insert into poi_images (id, poi_id, content_type, data, width, height)
    values (${img.id}, null, ${img.contentType}, ${img.data as any}, ${img.width ?? null}, ${img.height ?? null})
    on conflict (id) do update
      set content_type = excluded.content_type,
          data = excluded.data,
          width = excluded.width,
          height = excluded.height
  `;
  return { id: img.id, url: `/api/image/${img.id}` };
}

export async function getImage(id: string): Promise<{ contentType: string; data: Uint8Array } | null> {
  const rows = await sql/*sql*/`select content_type, data from poi_images where id = ${id} limit 1`;
  if (!rows.length) return null;
  const r = rows[0];
  return { contentType: r.content_type, data: r.data as Uint8Array };
}
