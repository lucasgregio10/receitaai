interface Env {
  AI: {
    run(model: string, inputs: Record<string, unknown>): Promise<any>;
  };
  ALLOWED_ORIGINS: string;
  TEXT_MODEL?: string;
  IMAGE_MODEL?: string;
}

type PantryMode = "basics" | "provided" | "missing";

interface GenerateRequest {
  ingredients: string[];
  servings: number;
  dietaryRestrictions?: string;
  pantryMode?: PantryMode;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: "Fácil" | "Médio" | "Difícil";
  servings: number;
  ingredients: { name: string; quantity: string; available: boolean }[];
  steps: string[];
  tips: string;
  imagePrompt: string;
  imageDataUrl?: string;
  imageError?: string;
}

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return "*";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function extractModelObject(result: any): any {
  if (result?.response && typeof result.response === "object") return result.response;
  if (typeof result?.response === "string") return JSON.parse(result.response);
  if (typeof result === "string") return JSON.parse(result);
  if (result?.output_text) return JSON.parse(result.output_text);
  throw new Error("A IA não retornou uma resposta estruturada.");
}

function validateRecipes(value: any, servings: number): Recipe[] {
  const recipes = Array.isArray(value) ? value : value?.recipes;
  if (!Array.isArray(recipes) || recipes.length < 3) {
    throw new Error("A IA não conseguiu montar três receitas. Tente novamente.");
  }
  return recipes.slice(0, 3).map((r: any, index: number) => ({
    id: index + 1,
    title: String(r.title || `Receita ${index + 1}`).slice(0, 90),
    description: String(r.description || "").slice(0, 280),
    prepTime: Math.max(0, Number(r.prepTime) || 0),
    cookTime: Math.max(0, Number(r.cookTime) || 0),
    difficulty: ["Fácil", "Médio", "Difícil"].includes(r.difficulty) ? r.difficulty : "Médio",
    servings,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 24).map((i: any) => ({
      name: String(i.name || "").slice(0, 90),
      quantity: String(i.quantity || "a gosto").slice(0, 60),
      available: Boolean(i.available),
    })) : [],
    steps: Array.isArray(r.steps) ? r.steps.slice(0, 12).map((s: any) => String(s).slice(0, 500)) : [],
    tips: String(r.tips || "").slice(0, 400),
    imagePrompt: String(r.imagePrompt || `Professional gourmet food photography of ${r.title}, appetizing plated dish, natural window light, editorial restaurant photography, no text, no watermark`).slice(0, 900),
  }));
}

async function generateRecipes(env: Env, input: GenerateRequest): Promise<Recipe[]> {
  const modeInstructions: Record<PantryMode, string> = {
    basics: "Pode considerar itens básicos comuns (sal, pimenta, óleo e temperos simples), mesmo não listados. Identifique-os como disponíveis.",
    provided: "Use exclusivamente os ingredientes informados. Não inclua ingredientes extras, exceto água quando tecnicamente indispensável.",
    missing: "Priorize os ingredientes informados. Ingredientes extras são permitidos, mas marque available=false e liste claramente o que falta.",
  };

  const schema = {
    type: "object",
    properties: {
      recipes: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            prepTime: { type: "integer" },
            cookTime: { type: "integer" },
            difficulty: { type: "string", enum: ["Fácil", "Médio", "Difícil"] },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  available: { type: "boolean" },
                },
                required: ["name", "quantity", "available"],
              },
            },
            steps: { type: "array", items: { type: "string" } },
            tips: { type: "string" },
            imagePrompt: { type: "string" },
          },
          required: ["title", "description", "prepTime", "cookTime", "difficulty", "ingredients", "steps", "tips", "imagePrompt"],
        },
      },
    },
    required: ["recipes"],
  };

  const prompt = [
    "Você é chef de cozinha e redator culinário brasileiro. Responda em português brasileiro.",
    "Crie exatamente três receitas diferentes, realistas e saborosas, que possam ser preparadas em uma cozinha doméstica.",
    `Ingredientes disponíveis: ${input.ingredients.join(", ")}.`,
    `Porções: ${input.servings}.`,
    `Restrições/preferências alimentares: ${input.dietaryRestrictions?.trim() || "Nenhuma informada"}.`,
    `Regra de ingredientes: ${modeInstructions[input.pantryMode || "basics"]}`,
    "As quantidades devem ser coerentes com o número de porções. Liste etapas claras e numeradas em ordem. Não invente alegações nutricionais.",
    "imagePrompt deve ser em inglês, descrever somente a aparência do prato final, fotografia gastronômica editorial realista, prato servido em louça bonita, luz natural suave, enquadramento 3/4, sem pessoas, sem letras, sem logotipos, sem marca d'água. A imagem precisa corresponder exatamente à receita.",
    "Não inclua markdown nem texto fora do JSON.",
  ].join("\n");

  const result = await env.AI.run(env.TEXT_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages: [
      { role: "system", content: "Gere conteúdo culinário útil, seguro e estruturado. Nunca substitua restrições alimentares por ingredientes incompatíveis." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "recipe_suggestions", schema, strict: true },
    },
    max_tokens: 3500,
  });

  return validateRecipes(extractModelObject(result), input.servings);
}

async function generateImage(env: Env, prompt: string): Promise<string> {
  const result = await env.AI.run(env.IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell", {
    prompt: `${prompt}. Premium gourmet food magazine photography, appetizing freshly cooked food, realistic textures, elegant neutral ceramic plate, warm natural side lighting, shallow depth of field, refined composition, 4:3 landscape image. No text, no watermark, no collage.`,
    steps: 4,
  });

  if (typeof result?.image === "string") return `data:image/jpeg;base64,${result.image}`;
  if (result?.image instanceof Uint8Array) {
    let binary = "";
    for (let i = 0; i < result.image.length; i += 0x8000) {
      binary += String.fromCharCode(...result.image.subarray(i, i + 0x8000));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  }
  if (result instanceof Uint8Array) {
    let binary = "";
    for (let i = 0; i < result.length; i += 0x8000) {
      binary += String.fromCharCode(...result.subarray(i, i + 0x8000));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  }
  throw new Error("Formato de imagem inesperado retornado pelo modelo.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env);
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET" && new URL(request.url).pathname === "/api/health") {
      return json({ ok: true, service: "ReceitaAI API" }, 200, cors);
    }

    if (origin === null) return json({ error: "Origem não autorizada." }, 403, cors);

    const url = new URL(request.url);
    if (url.pathname !== "/api/generate" || request.method !== "POST") {
      return json({ error: "Rota não encontrada." }, 404, cors);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 12_000) return json({ error: "Requisição muito grande." }, 413, cors);

    let input: GenerateRequest;
    try {
      input = await request.json() as GenerateRequest;
    } catch {
      return json({ error: "Corpo da requisição inválido." }, 400, cors);
    }

    if (!Array.isArray(input.ingredients)) {
      return json({ error: "Informe os ingredientes como uma lista." }, 400, cors);
    }

    const ingredients = [...new Set(
      input.ingredients
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLocaleLowerCase("pt-BR"))
        .filter(Boolean)
    )];

    if (ingredients.length === 0) {
      return json({ error: "Adicione pelo menos um ingrediente." }, 400, cors);
    }
    if (ingredients.length > 30) {
      return json({ error: "Você pode informar até 30 ingredientes." }, 400, cors);
    }
    if (ingredients.some((value) => value.length > 50)) {
      return json({ error: "Cada ingrediente pode ter no máximo 50 caracteres." }, 400, cors);
    }

    const servings = Math.min(12, Math.max(1, Math.round(Number(input.servings) || 2)));
    const pantryMode: PantryMode = ["basics", "provided", "missing"].includes(input.pantryMode || "")
      ? input.pantryMode as PantryMode : "basics";
    const dietaryRestrictions = String(input.dietaryRestrictions || "").slice(0, 240);

    try {
      const recipes = await generateRecipes(env, { ingredients, servings, dietaryRestrictions, pantryMode });

      // As três imagens são solicitadas em paralelo para reduzir o tempo total.
      const imageResults = await Promise.allSettled(
        recipes.map((recipe) => generateImage(env, recipe.imagePrompt))
      );

      recipes.forEach((recipe, index) => {
        const result = imageResults[index];
        if (result.status === "fulfilled") recipe.imageDataUrl = result.value;
        else recipe.imageError = "Não foi possível gerar esta imagem. Você pode tentar gerar as receitas novamente.";
      });

      return json({ recipes, generatedAt: new Date().toISOString() }, 200, cors);
    } catch (error) {
      console.error("ReceitaAI generation error:", error);
      const message = error instanceof Error ? error.message : "Erro inesperado ao gerar receitas.";
      return json({
        error: message.includes("JSON") || message.includes("receitas")
          ? message
          : "Não foi possível gerar as receitas agora. Verifique a configuração/limites do Workers AI e tente novamente.",
      }, 502, cors);
    }
  },
} satisfies ExportedHandler<Env>;
