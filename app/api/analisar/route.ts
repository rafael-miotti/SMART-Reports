import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/gemini";
import { IMAGE_TYPES, MAX_DESCRIPTION_LENGTH, MAX_IMAGE_BYTES, matchesImageSignature } from "@/lib/report";

export const runtime = "nodejs";
export const maxDuration = 90;

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // Bound the entire multipart body, including requests without Content-Length.
  const bodyLimit = MAX_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > bodyLimit) {
    return failure("A imagem deve ter no máximo 4 MB.", 413);
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return failure("Envie a imagem como formulário multipart.", 400);
  }
  let form: FormData;
  try {
    const reader = request.body?.getReader();
    if (!reader) return failure("Envie uma imagem para analisar.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) {
        await reader.cancel();
        return failure("A imagem deve ter no máximo 4 MB.", 413);
      }
      chunks.push(value);
    }
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    return failure("Não foi possível ler o arquivo. Selecione a imagem novamente.", 400);
  }
  const image = form.get("image");
  const description = form.get("description") ?? "";
  if (!(image instanceof File) || !image.size) return failure("Selecione uma imagem para analisar.", 400);
  if (!IMAGE_TYPES.includes(image.type)) return failure("Use uma imagem JPG, PNG ou WEBP.", 415);
  if (image.size > MAX_IMAGE_BYTES) return failure("A imagem deve ter no máximo 4 MB.", 413);
  if (typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH) {
    return failure("A descrição deve ter no máximo 2.000 caracteres.", 400);
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  if (!matchesImageSignature(bytes, image.type)) return failure("O conteúdo do arquivo não corresponde ao formato da imagem.", 415);
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return failure("A análise está indisponível: configure GEMINI_API_KEY no servidor.", 503);
  }
  try {
    const report = await analyzeImage(bytes.toString("base64"), image.type, description.trim());
    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    // Never return or log provider errors: they can contain request details.
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
    if (status === 429) return failure("Limite de solicitações do Gemini atingido. Aguarde e tente novamente.", 429);
    if (status === 401 || status === 403) return failure("Não foi possível autenticar no Gemini. Verifique a chave e as permissões no servidor.", 503);
    return failure("Não foi possível concluir a análise com o Gemini. Verifique a conexão e tente novamente.", 502);
  }
}
