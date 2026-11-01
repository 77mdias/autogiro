import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET!;
const PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET!;

export function fotoUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function uploadFoto(key: string, body: Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function uploadCnh(key: string, body: Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

/** URL assinada de leitura da CNH, válida por 5 minutos. Chame só após checar a posse da loja. */
export function cnhSignedUrl(key: string) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }), { expiresIn: 300 });
}

async function deleteFrom(bucket: string, keys: string[]): Promise<string[]> {
  const deleted: string[] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    const res = await r2.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: false },
      }),
    );
    for (const d of res.Deleted ?? []) if (d.Key) deleted.push(d.Key);
  }
  return deleted;
}

/** Exclui CNHs do bucket privado. Retorna as chaves efetivamente excluídas. */
export const deleteCnhs = (keys: string[]) => deleteFrom(PRIVATE_BUCKET, keys);

export const deleteFotos = (keys: string[]) => deleteFrom(PUBLIC_BUCKET, keys);
