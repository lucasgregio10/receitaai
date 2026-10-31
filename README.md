# ReceitaAI

MVP de aplicação web para sugerir três receitas com base nos ingredientes disponíveis e gerar uma imagem ilustrativa para cada prato usando Cloudflare Workers AI.

## Arquitetura

- `web/`: React + Vite + TypeScript + Tailwind. Publicação estática no Cloudflare Pages.
- `worker/`: API Cloudflare Workers com binding `AI` do Workers AI.
- Texto: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` com saída JSON estruturada.
- Imagens: `@cf/black-forest-labs/flux-1-schnell`.

A API gera as três receitas e, em seguida, solicita três imagens em paralelo. As imagens são devolvidas como data URLs; este MVP não persiste imagens.

## Requisitos

- Node.js 20.19+ (ou versão LTS atual compatível com Vite)
- npm
- Conta Cloudflare com Workers AI habilitado
- Wrangler CLI (instalado como dependência do worker)

## 1. Instalar dependências

Em um terminal, na raiz:

```bash
cd worker
npm install
cd ../web
npm install
```

## 2. Executar localmente

### API (terminal 1)

```bash
cd worker
npx wrangler dev
```

O Wrangler fornece uma URL local, normalmente `http://localhost:8787`.

### Interface (terminal 2)

Crie `web/.env.local`:

```env
VITE_API_URL=http://localhost:8787
```

Depois:

```bash
cd web
npm run dev
```

Abra a URL indicada pelo Vite (normalmente `http://localhost:5173`).

**Nota:** para executar inferência real localmente, autentique o Wrangler na Cloudflare (`npx wrangler login`). O binding remoto de IA é configurado em `worker/wrangler.toml`.

## 3. Configurar e publicar o Worker

Na pasta `worker`, edite `wrangler.toml`:

- `name`: nome único do Worker.
- `ALLOWED_ORIGINS`: origem do site publicada. Durante testes pode manter localhost e depois adicionar o domínio Pages.

Exemplo:

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://SEU-PROJETO.pages.dev"
```

Faça login:

```bash
cd worker
npx wrangler login
```

Publique:

```bash
npx wrangler deploy
```

Guarde a URL exibida, por exemplo `https://receitaai-api.SEUA-CONTA.workers.dev`.

## 4. Publicar o frontend no Cloudflare Pages

Crie `web/.env.production` (ou configure a variável no painel Pages):

```env
VITE_API_URL=https://SUA-API.workers.dev
```

Faça build:

```bash
cd web
npm run build
```

No painel Cloudflare:
1. Acesse **Workers & Pages** > **Create** > **Pages** > **Connect to Git**.
2. Selecione o repositório GitHub.
3. Configure `web` como **Root directory**.
4. Build command: `npm run build`.
5. Build output directory: `dist`.
6. Cadastre `VITE_API_URL` nas variáveis de ambiente de produção e preview.
7. Salve e faça o deploy.

Alternativa via CLI, depois do build:

```bash
npx wrangler pages deploy dist --project-name=receitaai
```

O `VITE_API_URL` precisa estar definido antes do `npm run build`, pois variáveis `VITE_` são incorporadas ao frontend durante o build.

## 5. Testar a API

```bash
curl -X POST "https://SUA-API.workers.dev/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["frango", "arroz", "tomate", "cebola", "alho"],
    "servings": 2,
    "dietaryRestrictions": "",
    "pantryMode": "basics"
  }'
```

A resposta contém `recipes`, e cada receita tem `imageDataUrl`.

## Funcionalidades do MVP

- Inclusão/remoção de ingredientes com Enter.
- Quantidade de porções.
- Restrições alimentares opcionais.
- Modo de despensa:
  - `basics`: permite básicos como sal, óleo e temperos.
  - `provided`: usa apenas ingredientes informados.
  - `missing`: prioriza os informados e lista complementos necessários.
- Exatamente três receitas.
- Três imagens ilustrativas geradas por IA.
- Visualização detalhada de ingredientes e preparo.
- Tratamento de erros e botão para tentar novamente.

## Limites, custos e observações

Workers AI tem franquia gratuita diária sujeita às regras e preços vigentes da Cloudflare. A franquia não significa geração ilimitada: cada chamada de texto e imagem consome recursos (Neurons). A geração de três imagens pode consumir mais que a geração de texto. Consulte:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/
- https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/

Este projeto não promete disponibilidade ilimitada nem custo zero em qualquer volume. Monitore o consumo no painel Cloudflare.

## Segurança antes de abrir ao público

O Worker valida payload, tamanho e origem CORS. CORS **não** é autenticação e não impede chamadas automatizadas. Antes de divulgar amplamente, adicione Cloudflare Turnstile e/ou rate limiting com Durable Objects ou Cloudflare rate limiting rules. Não coloque tokens Cloudflare no frontend.

As imagens são ilustrativas e podem diferir do resultado real. A IA pode cometer erros em quantidades, tempos e segurança alimentar; confira o preparo e cozinhe carnes/ovos adequadamente.

## Estrutura

```text
receitaai/
├── README.md
├── worker/
│   ├── src/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml
└── web/
    ├── src/App.tsx
    ├── src/main.tsx
    ├── src/index.css
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vite.config.ts
```
