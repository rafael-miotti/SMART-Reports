import assert from "node:assert/strict";
import { test } from "node:test";
import { isReport, matchesImageSignature } from "../lib/report.ts";

test("rejeita arquivos cujo conteúdo não corresponde ao MIME informado", () => {
  assert.equal(matchesImageSignature(new TextEncoder().encode("arquivo falso"), "image/png"), false);
  assert.equal(matchesImageSignature(new Uint8Array([255, 216, 255, 224]), "image/jpeg"), true);
  assert.equal(matchesImageSignature(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"), true);
  assert.equal(matchesImageSignature(new TextEncoder().encode("RIFF0000WEBP"), "image/webp"), true);
  assert.equal(matchesImageSignature(new TextEncoder().encode("RIFF0000JPEG"), "image/webp"), false);
});

test("rejeita saída vazia ou incompleta do modelo antes de exibir o relatório", () => {
  assert.equal(isReport(null), false);
  assert.equal(isReport({ resumo: "Observação" }), false);
  assert.equal(isReport({ resumo: " ", elementosVisuais: ["Rua"], informacoesUsuario: ["Sem relato"], limitacoes: ["Imagem estática"] }), false);
  assert.equal(isReport({ resumo: "Rua visível.", elementosVisuais: ["Rua"], informacoesUsuario: ["Sem relato"], limitacoes: [] }), false);
  assert.equal(isReport({ resumo: "Rua visível.", elementosVisuais: ["Rua"], informacoesUsuario: ["Sem relato"], limitacoes: ["Imagem estática"] }), true);
});
