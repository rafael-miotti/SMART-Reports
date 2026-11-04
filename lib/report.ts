export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const CIVIL_DEFENSE_NOTICE = "Este relatório não substitui orientações da Defesa Civil.";

export type Report = {
  resumo: string;
  elementosVisuais: string[];
  informacoesUsuario: string[];
  limitacoes: string[];
};

export function isReport(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  return typeof report.resumo === "string" && report.resumo.trim().length > 0 &&
    ["elementosVisuais", "informacoesUsuario", "limitacoes"].every((key) =>
      Array.isArray(report[key]) && report[key].length > 0 &&
      report[key].every((item: unknown) => typeof item === "string" && item.trim().length > 0));
}

export function matchesImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (mime === "image/webp") return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
