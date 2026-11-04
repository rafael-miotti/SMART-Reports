"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CIVIL_DEFENSE_NOTICE, IMAGE_TYPES, MAX_DESCRIPTION_LENGTH, MAX_IMAGE_BYTES, isReport, type Report } from "@/lib/report";

function Icon({ name, className = "" }: { name: "water" | "upload" | "document" | "arrow" | "shield"; className?: string }) {
  const paths = {
    water: <><path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z" /><path d="M8 15a4 4 0 0 0 4 4" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4" /></>,
    document: <><path d="M14 3H5v18h14V8l-5-5Z" /><path d="M14 3v5h5M9 12h6m-6 4h6" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    shield: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-5" /></>,
  };
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const sections = [
  { key: "resumo", title: "Resumo", hint: "Uma visão geral da ocorrência" },
  { key: "elementosVisuais", title: "Elementos visualmente identificados", hint: "O que é possível observar na fotografia" },
  { key: "informacoesUsuario", title: "Informações fornecidas pelo usuário", hint: "Contexto relatado, sem verificação independente" },
  { key: "limitacoes", title: "Limitações da análise", hint: "O que a imagem não permite concluir" },
] as const;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [description, setDescription] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (report) reportRef.current?.focus();
  }, [report]);

  function selectFile(next: File | null) {
    setReport(null);
    setError("");
    if (next && (!IMAGE_TYPES.includes(next.type) || next.size > MAX_IMAGE_BYTES || !next.size)) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setError("Selecione uma imagem JPG, PNG ou WEBP de até 4 MB.");
      return;
    }
    setFile(next);
  }

  function reset() {
    setFile(null); setDescription(""); setReport(null); setError("");
    if (inputRef.current) { inputRef.current.value = ""; inputRef.current.focus(); }
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || loading) return;
    setLoading(true); setError(""); setReport(null);
    try {
      const body = new FormData();
      body.append("image", file);
      body.append("description", description);
      const response = await fetch("/api/analisar", { method: "POST", body, signal: AbortSignal.timeout(90_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir a análise. Tente novamente.");
      if (!isReport(data.report)) throw new Error("O relatório recebido está incompleto. Tente novamente.");
      setReport(data.report);
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "TimeoutError"
        ? "A análise demorou mais que o esperado. Tente novamente."
        : cause instanceof TypeError ? "Falha de conexão. Verifique sua internet e tente novamente."
        : cause instanceof Error ? cause.message : "Não foi possível analisar a ocorrência. Tente novamente.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight" aria-label="SMART Relatos, início">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white"><Icon name="water" /></span>
            <span>SMART <span className="font-normal text-slate-500">Relatos</span></span>
          </a>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:text-xs">Protótipo acadêmico</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">Análise multimodal de ocorrências</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-[40px]">Uma imagem. Mais contexto.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Envie uma fotografia de uma possível ocorrência de alagamento e receba um relatório descritivo com apoio de inteligência artificial.</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.08fr]">
          <form onSubmit={analyze} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-busy={loading}>
            <div className="mb-6 flex items-center gap-3">
              <span className="step">01</span><div><h2 className="font-semibold">Registre a ocorrência</h2><p className="mt-1 text-sm text-slate-500">Comece pela fotografia do local.</p></div>
            </div>
            <fieldset disabled={loading || !!report} className="min-w-0 disabled:opacity-75">
              <label htmlFor="image" className="mb-2 block text-sm font-medium">Fotografia <span className="text-teal-700">*</span></label>
              <div className="relative">
                <input ref={inputRef} id="image" type="file" accept="image/jpeg,image/png,image/webp" className="peer sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} aria-describedby="image-help" />
                <label htmlFor="image" className="flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-teal-600 hover:bg-teal-50/40 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal-700">
                  {preview ? <>
                    {/* Native image keeps the local blob out of the image optimization service. */}
                    <img src={preview} alt="Pré-visualização da fotografia selecionada" className="max-h-64 w-full object-contain" onError={() => { selectFile(null); setError("Não foi possível abrir esta imagem. Selecione um arquivo válido."); }} />
                    <span className="block w-full truncate border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{file?.name} · Clique para trocar</span>
                  </> : <>
                    <span className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-teal-800"><Icon name="upload" /></span>
                    <span className="text-sm font-semibold text-slate-700">Clique para selecionar uma imagem</span>
                    <span id="image-help" className="mt-2 text-xs text-slate-500">JPG, PNG ou WEBP · Até 4 MB</span>
                  </>}
                </label>
              </div>
              <div className="mb-2 mt-6 flex items-baseline justify-between gap-2">
                <label htmlFor="description" className="text-sm font-medium">Descrição da ocorrência</label><span className="text-xs text-slate-500">Opcional</span>
              </div>
              <textarea id="description" rows={4} maxLength={MAX_DESCRIPTION_LENGTH} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva o que aconteceu ou acrescente um contexto que a imagem não mostra…" className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 placeholder:text-slate-400 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/15" aria-describedby="description-help" />
              <div id="description-help" className="mt-1 flex justify-between gap-3 text-[11px] text-slate-500"><span>O relato será separado das observações visuais.</span><span className="shrink-0">{description.length}/2.000</span></div>
            </fieldset>
            {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</div>}
            {report ? <button type="button" onClick={reset} className="primary-button mt-6">Realizar outra análise<Icon name="arrow" /></button> : <button type="submit" disabled={!file || loading} className="primary-button mt-6">{loading ? <><span className="spinner" />Analisando ocorrência…</> : <>Analisar ocorrência<Icon name="arrow" /></>}</button>}
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">A imagem é enviada ao Gemini para análise.<br />Esta aplicação não armazena fotografias ou relatos.</p>
          </form>

          <div ref={reportRef} tabIndex={-1} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none" aria-label="Relatório da análise" aria-busy={loading}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-7 sm:py-6">
              <div className="flex items-center gap-3"><span className="step">02</span><h2 className="font-semibold">Relatório da análise</h2></div>
              {report && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">Concluído</span>}
            </div>
            <div aria-live="polite" aria-atomic="true">
              {!report && <div className="px-7 pb-7 pt-9 text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-800">{loading ? <span className="spinner" /> : <Icon name="document" />}</span>
                <h3 className="text-sm font-semibold text-slate-700">{loading ? "Analisando a imagem e o contexto" : "Seu relatório aparecerá aqui"}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{loading ? "Aguarde enquanto o Gemini prepara as observações. Isso pode levar alguns instantes." : "Selecione uma fotografia e inicie a análise para visualizar as quatro seções abaixo."}</p>
              </div>}
              <div className="px-5 sm:px-7">
                {sections.map(({ key, title, hint }, index) => <section key={key} className="border-t border-slate-100 py-5 first:border-t-0">
                  <h3 className="flex gap-3 text-sm font-semibold text-slate-700"><span className="pt-0.5 font-mono text-[10px] text-teal-700">0{index + 1}</span>{title}</h3>
                  {report ? typeof report[key] === "string" ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{report[key]}</p> : <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{report[key].map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="ml-7 mt-1 text-xs leading-5 text-slate-400">{hint}</p>}
                </section>)}
              </div>
            </div>
            <div className="flex gap-3 border-t border-amber-100 bg-amber-50/70 px-5 py-4 text-xs leading-6 text-amber-900 sm:px-7"><Icon name="shield" className="mt-1 shrink-0" /><p>{CIVIL_DEFENSE_NOTICE} A ferramenta descreve evidências e não atribui nível de risco.</p></div>
          </div>
        </div>
        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:flex-row"><span>SMART Relatos · Pesquisa e experimentação acadêmica</span><span>Análise de imagem + texto com IA</span></footer>
      </main>
    </div>
  );
}
