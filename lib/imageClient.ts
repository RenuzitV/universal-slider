// src/lib/imageClient.ts
export async function compressAndToBase64(
  file: File,
  opts: { maxW?: number; maxH?: number; quality?: number } = {}
) {
  const { maxW = 2048, maxH = 2048, quality = 0.85 } = opts;

  // Create bitmap (fast) with fallback to HTMLImageElement if needed
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = await loadImageEl(URL.createObjectURL(file));
  }

  const { width, height } = scaleToFit(
    "width" in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth,
    "height" in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight,
    maxW,
    maxH
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap as any, 0, 0, width, height);

  // Re-encode (JPEG/WebP); JPEG is widely supported & small
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
  );

  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  return { contentType: blob.type || "image/jpeg", base64 };
}

function scaleToFit(w: number, h: number, maxW: number, maxH: number) {
  const r = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * r), height: Math.round(h * r) };
}
function loadImageEl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
