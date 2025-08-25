-- CreateTable: pois
CREATE TABLE "pois" (
  "id"           TEXT PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "description"  TEXT NOT NULL DEFAULT '',
  "moment_date"  TIMESTAMPTZ NOT NULL,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable: poi_images
CREATE TABLE "poi_images" (
  "id"           TEXT PRIMARY KEY,
  "poi_id"       TEXT REFERENCES "pois"("id") ON DELETE CASCADE,
  "content_type" TEXT NOT NULL,
  "data"         BYTEA NOT NULL,
  "width"        INTEGER,
  "height"       INTEGER,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index for lookups
CREATE INDEX "poi_images_poi_id_idx" ON "poi_images"("poi_id");
