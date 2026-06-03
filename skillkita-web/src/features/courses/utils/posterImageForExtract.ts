import { isImagePoster, isPdfPoster } from "./posterFileTypes";

const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.85;

export type PosterImagePayload = {
  mimeType: "image/jpeg";
  imageBase64: string;
};

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load poster image."));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToJpegPayload(canvas: HTMLCanvasElement): Promise<PosterImagePayload> {
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return {
    mimeType: "image/jpeg",
    imageBase64: dataUrlToBase64(dataUrl),
  };
}

async function resizeImageToJpegPayload(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering not available.");
  ctx.drawImage(source, 0, 0, w, h);
  return canvasToJpegPayload(canvas);
}

export async function renderPdfFirstPageToJpegPayload(file: File): Promise<PosterImagePayload> {
  const [{ getDocument, GlobalWorkerOptions }, workerUrlMod] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker?url"),
  ]);
  GlobalWorkerOptions.workerSrc = (workerUrlMod as { default: string }).default;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering not available.");

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  return canvasToJpegPayload(canvas);
}

export async function posterFileToExtractPayload(file: File): Promise<PosterImagePayload> {
  if (isPdfPoster(file)) {
    return renderPdfFirstPageToJpegPayload(file);
  }
  if (isImagePoster(file)) {
    const img = await loadImageFromFile(file);
    return resizeImageToJpegPayload(img, img.naturalWidth, img.naturalHeight);
  }
  throw new Error("Unsupported poster file type.");
}
