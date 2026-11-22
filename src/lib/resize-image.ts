/**
 * Reduz foto no navegador antes do envio (rápido no 4G e cabe no limite das server actions).
 * PDFs e formatos não suportados voltam intactos.
 */
// type "image/png" guarda a transparência (logo); JPEG pinta o fundo transparente de preto.
export async function resizeImage(file: File, maxSide = 1600, quality = 0.82, type: "image/jpeg" | "image/png" = "image/jpeg"): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
    const ext = type === "image/png" ? ".png" : ".jpg";
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ext, { type }) : file;
  } catch {
    return file; // ex.: HEIC em navegador sem suporte — o servidor recusa com mensagem clara
  }
}
