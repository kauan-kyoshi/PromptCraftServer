# AI Document Summarizer

Uma API simples que recebe um texto e retorna um resumo executivo gerado por um modelo de linguagem (LLM) — integrando com o Gemini (AI Studio) da Google.

Este README explica, em linguagem simples, o que o projeto faz e mostra passo a passo como clonar, configurar e testar localmente.

## O que é este projeto?

- Objetivo: receber textos longos via uma rota HTTP e retornar um resumo objetivo e sucinto usando um serviço de IA.
- Público-alvo: desenvolvedores e time técnico que precisam de um resumo automático de documentos ou textos.

Mesmo que você não seja programador, este projeto permite que você envie um texto (por exemplo, um artigo ou uma ata de reunião) e receba um resumo em poucos segundos.

## Pré-requisitos

 - Node.js (versão 18+ recomendada)
- npm
- Uma chave de API do Google AI Studio (Gemini) com permissão para usar modelos generativos

## O que são essas chaves e como conseguir

Este projeto usa variáveis de ambiente para autenticar com provedores de IA. As principais chaves são:

- `LLM_API_KEY` — chave da API do Google AI (AI Studio / Gemini). Permite ao servidor chamar os modelos generativos.
- `OPENAI_API_KEY` — opcional; só use se quiser integrar com OpenAI em outro fluxo.
- `GEMINI_MODEL` — nome do modelo Gemini a ser usado (ex.: `models/gemini-3.6-flash`).

Como obter uma `LLM_API_KEY` (Google AI / Gemini):

1. Acesse https://console.cloud.google.com/ e faça login com sua conta Google.
2. Crie um novo projeto (ou selecione um existente).
3. No menu "APIs e serviços" (APIs & Services), clique em "Ativar APIs e serviços" e procure por "Generative Language API" ou "AI Studio / Gemini" e ative-a.
4. No painel "Credenciais" (Credentials), clique em "Criar credenciais" → "Chave da API" (API key).
5. Copie a chave gerada e coloque em `.env` como `LLM_API_KEY=SEU_VALOR_AQUI`.

Observações de segurança:

- Restrinja a chave por IP ou referrer quando possível (na página de credenciais) para reduzir risco de uso indevido.
- Para produção, prefira usar um Service Account com permissões minimizadas e armazenar a chave no gerenciador de segredos (Google Secret Manager, GitHub Secrets, etc.).
- Se a chave foi exposta ou comprometida, revogue-a imediatamente e gere uma nova.

## Como clonar e rodar (passo a passo)

1. Clone o repositório (substitua `YOUR_REPO_URL` pelo link do seu GitHub):

```bash
git clone YOUR_REPO_URL
cd ai-document-summarizer
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite .env e cole sua chave em LLM_API_KEY
```

No arquivo `.env` você deve ter pelo menos:

- `LLM_API_KEY` — sua chave do AI Studio
- `GEMINI_MODEL` — opcional, um modelo compatível (ex: `models/gemini-3.6-flash`). Se não informado, o projeto tenta um padrão.

4. Rodar em modo desenvolvimento:

```bash
npm run dev
```

O servidor inicia por padrão na porta `3000`.

## Teste rápido (exemplo de uso)

Faça uma requisição POST para a rota `/api/ai/summarize` com um JSON contendo o campo `text`.

Exemplo com `curl`:

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"A inteligência artificial generativa está transformando o desenvolvimento de software moderno."}'
```

Resposta de exemplo (JSON):

```json
{
  "summary": "A inteligência artificial generativa aumentou a produtividade dos desenvolvedores, automatizou testes e documentação, mudou o papel do desenvolvedor para arquiteto/revisor e traz desafios como alucinações e questões de propriedade intelectual."
}
```

## Testes e dicas úteis

- Requisição com texto simples (sem JSON) e saída legível no terminal:

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: text/plain" \
  -H "Accept: text/plain" \
  -d 'Texto que você quer resumir aqui'
```

- Se preferir receber JSON mas ver apenas o texto no terminal, use `jq`:

```bash
curl -s -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: text/plain" \
  -d 'Texto aqui' | jq -r .summary
```

- Endpoint de diagnóstico (mostra o `body` e o `rawBody`):

```bash
curl -X POST http://localhost:3000/api/ai/debug-parse \
  -H "Content-Type: text/plain" \
  -d 'Qualquer texto ou JSON malformado aqui'
```

- Atalho para forçar retorno em texto simples: adicione `?plain=1` à URL, por exemplo:

```bash
curl -X POST "http://localhost:3000/api/ai/summarize?plain=1" \
  -H "Content-Type: application/json" \
  -d '{"text":"Texto aqui"}'
```

## Comandos úteis durante o desenvolvimento

- Rodar em desenvolvimento (hot-reload):

```bash
npm run dev
```

- Compilar e rodar a versão de produção localmente:

```bash
npm run build
npm start
```

- Em caso de conflito de porta (3000) o projeto inclui um helper para matar processos que estejam usando a porta:

```bash
npm run stop-dev
```

## Preparar para subir ao GitHub

- Garanta que `.env` não contenha chaves verdadeiras. O repositório inclui `.env.example`.
- Verifique o `.gitignore` (já contém `node_modules/`, `dist/`, `.env`).
- Antes de publicar, rode `npm run build` localmente e confirme que tudo compila.

---

## Executando em produção

1. Compile TypeScript:

```bash
npm run build
```

2. Inicie a versão compilada:

```bash
npm start
```

## Segurança e boas práticas

- Nunca publique suas chaves em repositórios públicos. O projeto já inclui `.gitignore` configurado para ignorar `.env`.
- Use variáveis de ambiente para armazenar chaves de API.
- Revise manualmente os resumos gerados antes de usá-los em produção — modelos podem gerar informações incorretas (alucinações).

## Onde editar o comportamento

- Código do serviço que chama o modelo: `src/services/aiService.ts`
- Rota que recebe as requisições: `src/routes/aiRoutes.ts`
- Controller que valida e responde: `src/controllers/aiController.ts`

