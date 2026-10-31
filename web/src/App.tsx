import { useMemo, useState } from "react";
import {
  ChefHat, Plus, X, Sparkles, Clock3, Users, Utensils, Leaf,
  ArrowRight, RefreshCw, ChevronDown, Check, Flame, BookOpen,
  AlertCircle, Image as ImageIcon, CookingPot, Heart, Salad
} from "lucide-react";

type Ingredient = { name: string; quantity: string; available: boolean };
type Recipe = {
  id: number; title: string; description: string; prepTime: number; cookTime: number;
  difficulty: string; servings: number; ingredients: Ingredient[]; steps: string[];
  tips: string; imageDataUrl?: string; imageError?: string;
};
type PantryMode = "basics" | "provided" | "missing";

const API_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [servings, setServings] = useState(2);
  const [restrictions, setRestrictions] = useState("");
  const [pantryMode, setPantryMode] = useState<PantryMode>("basics");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const totalTime = (r: Recipe) => (r.prepTime || 0) + (r.cookTime || 0);
  const ingredientCount = useMemo(() => ingredients.length, [ingredients]);

  function addIngredient(value = draft) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean || ingredients.some((i) => i.toLocaleLowerCase("pt-BR") === clean.toLocaleLowerCase("pt-BR"))) {
      setDraft("");
      return;
    }
    if (ingredients.length >= 30) {
      setError("Você pode adicionar até 30 ingredientes.");
      return;
    }
    setIngredients((current) => [...current, clean]);
    setDraft("");
    setError("");
  }

  function removeIngredient(value: string) {
    setIngredients((current) => current.filter((item) => item !== value));
  }

  async function generate() {
    if (!ingredients.length) {
      setError("Adicione pelo menos um ingrediente para começar.");
      return;
    }
    if (!API_URL && !import.meta.env.DEV) {
      setError("A API ainda não foi configurada. Defina VITE_API_URL no arquivo .env.local ou nas variáveis do Cloudflare Pages.");
      return;
    }
    setLoading(true);
    setError("");
    setSelected(null);
    setRecipes([]);
    setHasGenerated(false);
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, servings, dietaryRestrictions: restrictions, pantryMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar suas receitas.");
      if (!Array.isArray(data.recipes) || data.recipes.length !== 3) {
        throw new Error("A resposta da IA não trouxe as três receitas esperadas.");
      }
      setRecipes(data.recipes);
      setHasGenerated(true);
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-cream shadow-soft"><ChefHat size={25}/></span>
            <span><span className="block font-display text-xl font-bold tracking-tight">Receita<span className="text-olive">AI</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Inspiração à mesa</span></span>
          </a>
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold text-muted sm:flex"><Sparkles size={14} className="text-olive"/> Cozinha inteligente, sem complicação</div>
          <a href="#como-funciona" className="text-sm font-semibold text-forest transition hover:text-olive">Como funciona</a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-sage/40 blur-3xl"/>
          <div className="absolute -left-40 top-64 h-80 w-80 rounded-full bg-clay/20 blur-3xl"/>
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:pb-24 lg:pt-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-olive/20 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-olive"><span className="h-2 w-2 rounded-full bg-olive"/> Sua cozinha, reinventada</div>
              <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-forest sm:text-6xl lg:text-7xl">O que tem na sua cozinha <span className="italic text-olive">vira receita.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">Conte o que você tem na geladeira. Nossa inteligência culinária cria três ideias deliciosas para transformar ingredientes simples em momentos especiais.</p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted"><span className="flex items-center gap-2"><Check size={16} className="text-olive"/> 3 ideias personalizadas</span><span className="flex items-center gap-2"><Check size={16} className="text-olive"/> Fotos geradas por IA</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-5 rounded-[2.5rem] bg-sage/50 blur-2xl"/>
              <div className="relative overflow-hidden rounded-[2rem] border-[7px] border-white shadow-card">
                <img className="h-[350px] w-full object-cover sm:h-[430px]" src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" alt="Mesa gourmet com ingredientes frescos e prato preparado"/>
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-soft backdrop-blur">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.16em] text-olive">Inspiração do dia</span><span className="rounded-full bg-sage px-3 py-1 text-[10px] font-bold text-forest">FEITO COM O QUE VOCÊ TEM</span></div>
                  <p className="mt-2 font-display text-xl font-semibold text-forest">Simples ingredientes. Grandes sabores.</p>
                </div>
              </div>
              <div className="absolute -right-3 top-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta text-white shadow-card sm:-right-6"><Leaf size={29}/></div>
            </div>
          </div>
        </section>

        <section id="criar" className="relative z-10 mx-auto -mt-2 max-w-7xl px-5 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-card">
            <div className="grid lg:grid-cols-[.78fr_1.22fr]">
              <div className="bg-forest p-7 text-cream sm:p-10">
                <span className="text-xs font-bold uppercase tracking-[.2em] text-sage">01 / Sua despensa</span>
                <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Vamos descobrir o que podemos cozinhar?</h2>
                <p className="mt-4 text-sm leading-7 text-cream/70">Adicione os ingredientes que você já tem. Não precisa estar tudo perfeito — a criatividade fica por nossa conta.</p>
                <div className="mt-9 hidden rounded-2xl border border-white/15 bg-white/5 p-5 sm:block">
                  <div className="flex items-center gap-3"><CookingPot className="text-sage"/><span className="text-sm font-semibold">Dica do chef</span></div>
                  <p className="mt-3 text-sm leading-6 text-cream/70">Inclua temperos, sobras e ingredientes que estão quase esquecidos na geladeira. Eles podem ser a estrela do prato.</p>
                </div>
              </div>
              <div className="p-6 sm:p-10">
                <div className="flex items-center justify-between"><label className="text-sm font-bold text-forest">Ingredientes disponíveis</label><span className="text-xs font-medium text-muted">{ingredientCount}/30 adicionados</span></div>
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addIngredient(); }}>
                  <div className="relative flex-1"><Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18}/><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex.: ovos, queijo, abobrinha..." className="h-14 w-full rounded-xl border border-line bg-[#FAF9F6] pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-olive focus:ring-4 focus:ring-olive/10"/></div>
                  <button type="submit" className="flex h-14 w-14 items-center justify-center rounded-xl bg-forest text-white transition hover:bg-olive" aria-label="Adicionar ingrediente"><Plus/></button>
                </form>
                <div className="mt-5 flex min-h-24 flex-wrap content-start gap-2">
                  {ingredients.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-sage bg-sage/40 px-3.5 py-2 text-sm font-semibold text-forest">{item}<button onClick={() => removeIngredient(item)} className="rounded-full p-0.5 text-olive/70 transition hover:bg-white hover:text-terracotta" aria-label={`Remover ${item}`}><X size={14}/></button></span>)}
                  {!ingredients.length && <p className="text-sm text-muted">Seus ingredientes aparecerão aqui.</p>}
                </div>
                <div className="my-7 border-t border-line"/>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className="mb-2 block text-sm font-bold text-forest">Quantas pessoas?</label><div className="relative"><Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17}/><select value={servings} onChange={(e) => setServings(Number(e.target.value))} className="h-12 w-full appearance-none rounded-xl border border-line bg-[#FAF9F6] pl-11 pr-10 text-sm font-medium outline-none focus:border-olive">{[1,2,3,4,5,6,8,10,12].map((n) => <option key={n} value={n}>{n} {n === 1 ? "pessoa" : "pessoas"}</option>)}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={16}/></div></div>
                  <div><label className="mb-2 block text-sm font-bold text-forest">Preferências / restrições</label><input value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Ex.: sem lactose, vegetariano..." className="h-12 w-full rounded-xl border border-line bg-[#FAF9F6] px-4 text-sm outline-none placeholder:text-muted/70 focus:border-olive"/></div>
                </div>
                <div className="mt-5"><label className="mb-2 block text-sm font-bold text-forest">Como usar os ingredientes?</label><select value={pantryMode} onChange={(e) => setPantryMode(e.target.value as PantryMode)} className="h-12 w-full rounded-xl border border-line bg-[#FAF9F6] px-4 text-sm outline-none focus:border-olive"><option value="basics">Pode considerar básicos (sal, óleo e temperos)</option><option value="provided">Somente o que informei</option><option value="missing">Pode sugerir extras e mostrar o que falta</option></select></div>
                {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
                <button onClick={generate} disabled={loading || !ingredients.length} className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-terracotta px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(173,91,66,.22)] transition hover:-translate-y-0.5 hover:bg-[#995039] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><RefreshCw className="animate-spin" size={18}/> Criando suas receitas...</> : <><Sparkles size={18}/> Criar minhas 3 receitas <ArrowRight size={18}/></>}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted">A IA prepara as sugestões e gera uma imagem ilustrativa para cada prato.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="scroll-mt-24 bg-[#F0F1E9] py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><span className="text-xs font-bold uppercase tracking-[.2em] text-olive">02 / Seu menu personalizado</span><h2 className="mt-3 font-display text-4xl font-semibold text-forest sm:text-5xl">{hasGenerated ? "Olha só o que saiu!" : "Boas ideias começam aqui."}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-muted">{hasGenerated ? "Três caminhos deliciosos usando seus ingredientes. Escolha o que mais combina com o seu momento." : "Suas sugestões aparecerão aqui, com fotos criadas especialmente para cada receita."}</p></div>
              {hasGenerated && <button onClick={generate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-forest/20 bg-white px-5 py-3 text-sm font-bold text-forest transition hover:border-olive hover:text-olive disabled:opacity-50"><RefreshCw size={16}/> Gerar outras opções</button>}
            </div>
            {loading && <div className="mt-10 grid gap-5 md:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="overflow-hidden rounded-2xl bg-white shadow-soft"><div className="skeleton h-56"/><div className="space-y-3 p-5"><div className="skeleton h-5 w-3/4"/><div className="skeleton h-4 w-full"/><div className="skeleton h-10 w-1/2"/></div></div>)}</div>}
            {!loading && recipes.length > 0 && <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{recipes.map((recipe, index) => <article key={`${recipe.id}-${index}`} className="group overflow-hidden rounded-2xl border border-white bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
              <div className="relative h-60 overflow-hidden bg-sage">{recipe.imageDataUrl ? <img src={recipe.imageDataUrl} alt={`Imagem ilustrativa de ${recipe.title}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full flex-col items-center justify-center gap-2 text-olive"><ImageIcon size={34}/><span className="text-xs font-semibold">Imagem indisponível</span></div>}<span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-forest backdrop-blur">Opção 0{index+1}</span><span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-forest/90 px-3 py-1.5 text-xs font-semibold text-white"><Clock3 size={13}/>{totalTime(recipe)} min</span></div>
              <div className="p-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-olive"><span>{recipe.difficulty}</span><span className="h-1 w-1 rounded-full bg-clay"/> <span>{recipe.servings} porções</span></div><h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-forest">{recipe.title}</h3><p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-6 text-muted">{recipe.description}</p><div className="mt-5 flex items-center justify-between border-t border-line pt-4"><span className="text-xs text-muted">{recipe.ingredients.length} ingredientes</span><button onClick={() => setSelected(recipe)} className="inline-flex items-center gap-2 text-sm font-bold text-terracotta transition hover:gap-3">Ver receita <ArrowRight size={16}/></button></div></div>
            </article>)}</div>}
            {!loading && !recipes.length && <div className="mt-10 rounded-3xl border border-dashed border-olive/30 bg-white/50 px-6 py-14 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage text-olive"><Salad size={30}/></div><p className="mt-5 font-display text-2xl font-semibold text-forest">Sua próxima receita está esperando.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Adicione os ingredientes acima e deixe a inteligência culinária fazer sua mágica.</p><a href="#criar" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-olive">Adicionar ingredientes <ArrowRight size={16}/></a></div>}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="text-center"><span className="text-xs font-bold uppercase tracking-[.2em] text-olive">Cozinhar ficou mais simples</span><h2 className="mt-3 font-display text-4xl font-semibold text-forest">Da despensa à mesa em 3 passos.</h2></div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">{[{icon:<Utensils size={25}/>,n:"01",title:"Conte o que você tem",desc:"Adicione os ingredientes disponíveis e conte para quantas pessoas vai cozinhar."},{icon:<Sparkles size={25}/>,n:"02",title:"Receba sua inspiração",desc:"A IA combina os ingredientes e cria três receitas com fotos ilustrativas exclusivas."},{icon:<BookOpen size={25}/>,n:"03",title:"Escolha e prepare",desc:"Abra sua favorita, confira as quantidades e siga o passo a passo até servir."}].map((item) => <div key={item.n} className="rounded-2xl border border-line bg-white p-7"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage text-olive">{item.icon}</span><span className="font-display text-4xl text-sage">{item.n}</span></div><h3 className="mt-6 font-display text-2xl font-semibold text-forest">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{item.desc}</p></div>)}</div>
        </section>
      </main>

      <footer className="bg-forest px-5 py-10 text-cream lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><ChefHat/></span><span className="font-display text-xl font-bold">ReceitaAI</span></div><p className="max-w-md text-xs leading-6 text-cream/60">Feito para aproveitar melhor o que já existe na sua cozinha. Imagens geradas por inteligência artificial são ilustrativas.</p><span className="text-xs text-cream/50">© {new Date().getFullYear()} ReceitaAI · Feito por Lucas</span></div></footer>
      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div role="dialog" aria-modal="true" aria-label={selected.title} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-cream shadow-card sm:rounded-3xl">
          <div className="relative h-64 bg-sage sm:h-80">{selected.imageDataUrl && <img src={selected.imageDataUrl} alt={selected.title} className="h-full w-full object-cover"/>}<button onClick={() => setSelected(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-forest shadow-soft" aria-label="Fechar"><X/></button></div>
          <div className="p-6 sm:p-9"><span className="text-xs font-bold uppercase tracking-[.18em] text-olive">Sua escolha</span><h2 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">{selected.title}</h2><p className="mt-3 text-sm leading-7 text-muted">{selected.description}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">{[{icon:<Clock3 size={18}/>,label:"Tempo total",value:`${totalTime(selected)} min`},{icon:<Flame size={18}/>,label:"Dificuldade",value:selected.difficulty},{icon:<Users size={18}/>,label:"Porções",value:String(selected.servings)}].map((x) => <div key={x.label} className="rounded-xl bg-white p-3 text-center"><div className="mx-auto flex justify-center text-olive">{x.icon}</div><p className="mt-2 text-[10px] uppercase tracking-wider text-muted">{x.label}</p><p className="mt-1 text-sm font-bold text-forest">{x.value}</p></div>)}</div>
            <div className="mt-8 grid gap-9 md:grid-cols-[.8fr_1.2fr]"><div><h3 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest"><ShoppingBasketIcon/> Ingredientes</h3><ul className="mt-4 space-y-3">{selected.ingredients.map((item, i) => <li key={i} className="flex items-start gap-3 border-b border-line pb-3 text-sm"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.available ? "bg-sage text-olive" : "bg-clay/20 text-terracotta"}`}>{item.available ? <Check size={12}/> : <Plus size={12}/>}</span><span className="flex-1 text-ink">{item.name}<span className="block text-xs text-muted">{item.quantity}</span></span></li>)}</ul><p className="mt-3 text-[11px] text-muted">Itens marcados com + podem precisar ser comprados.</p></div><div><h3 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest"><CookingPot/> Modo de preparo</h3><ol className="mt-4 space-y-4">{selected.steps.map((step, i) => <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{i+1}</span><p className="pt-1 text-sm leading-6 text-muted">{step}</p></li>)}</ol></div></div>
            {selected.tips && <div className="mt-8 rounded-2xl border border-olive/15 bg-sage/50 p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-olive"><Heart size={15}/> Dica do chef</p><p className="mt-2 text-sm leading-6 text-forest">{selected.tips}</p></div>}
            <p className="mt-7 text-[11px] leading-5 text-muted">Confira os ingredientes e o ponto de cozimento antes de servir. Em caso de alergias, verifique todos os rótulos e possíveis contaminações cruzadas.</p>
          </div>
        </div>
      </div>}
    </div>
  );
}

function ShoppingBasketIcon() {
  return <span className="inline-flex"><Utensils size={22}/></span>;
}

export default App;
