# SMART Relatos

Protótipo acadêmico em Next.js (App Router), TypeScript e Tailwind CSS para análise multimodal de possíveis ocorrências de alagamento. Recebe uma fotografia e uma descrição opcional e apresenta um relatório em quatro seções. Não usa respostas simuladas.

## Execução local

Requisitos: Node.js 22.13 ou superior e uma chave da Gemini API com acesso ao modelo e cota disponível. Crie a chave no [Google AI Studio](https://aistudio.google.com/api-keys).

```powershell
npm ci
Copy-Item .env.example .env.local
```

Edite `.env.local` e preencha:

```dotenv
GEMINI_API_KEY=sua_chave_aqui
```

Não use o prefixo `NEXT_PUBLIC_`. A chave é lida exclusivamente de `GEMINI_API_KEY` no servidor. Reinicie o servidor após alterar a variável.

```powershell
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Selecione uma imagem JPG, PNG ou WEBP de até 5 MB, preencha a descrição se desejar (até 2.000 caracteres) e clique em **Analisar ocorrência**. Após o resultado, **Realizar outra análise** limpa o formulário e o relatório. Em caso de erro, o formulário é preservado para tentar novamente.

## Verificação e produção local

```powershell
npm test
npm run typecheck
npm run build
npm start
```

O build não exige a chave. Uma análise real exige chave válida, acesso à internet, permissões e cota no Gemini; sem isso, a aplicação exibe um erro, sem gerar relatórios fictícios.

## Integração e limites

- `app/api/analisar/route.ts`: Route Handler `POST`, validação de tamanho, MIME, assinatura do arquivo e descrição; respostas sem cache. A assinatura não substitui uma decodificação completa: arquivos corrompidos também podem ser rejeitados na pré-visualização ou pelo Gemini.
- `lib/gemini.ts`: SDK oficial `@google/genai`, método `models.generateContent`, imagem em `inlineData` e descrição em uma única solicitação. Saída JSON estruturada e validada antes da exibição.
- Modelo fixado: **`gemini-3.5-flash-lite`**. Em consulta à documentação oficial em **03/11/2026**, consta como **Stable**, disponível para produção, com entrada de texto e imagens, saída textual e suporte a saída estruturada. A disponibilidade efetiva depende do acesso da conta.
- As instruções separam observações visuais de relatos não verificados, proíbem inventar elementos e atribuir nível de risco. Como em qualquer modelo generativo, essas instruções não garantem ausência de erros; o resultado exige leitura crítica.
- A aplicação não grava arquivos, imagens, relatos ou relatórios em disco, banco, histórico ou armazenamento do navegador. O conteúdo permanece temporariamente em memória durante o processamento e a sessão da página. A imagem e o texto são enviados ao Google; o tratamento pelo provedor segue os termos da Gemini API. Não é utilizada a Files API.
- Sem login, mapas, áudio ou integrações adicionais. Não há classificação de risco nem função de alerta.

**Este relatório não substitui orientações da Defesa Civil.** O aviso permanece visível no painel de resultados, independentemente da resposta do modelo.

## Documentação oficial consultada

- [Gemini 3.5 Flash-Lite: estabilidade, modalidades e recursos](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite)
- [Catálogo de modelos Gemini](https://aistudio.google.com/docs/models)
- [Entrada de imagens e dados inline](https://aistudio.google.com/docs/image-understanding)
- [SDK JavaScript: models.generateContent](https://googleapis.github.io/js-genai/release_docs/classes/models.Models.html#generateContent)
