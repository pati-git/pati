import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/hero.jpg";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { WHATSAPP_URL } from "@/lib/site";
import { WhatsAppIcon } from "@/components/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crochet by Pati' Dagan — Créations crochet faites main" },
      { name: "description", content: "Vêtements, sacs et accessoires en crochet faits main et personnalisables, pour elle et pour lui." },
      { property: "og:title", content: "Crochet by Pati' Dagan" },
      { property: "og:description", content: "Créations crochet élégantes, faites main avec passion." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(productsQuery)]),
  component: Index,
});

function Index() {
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const featured = products.filter((p) => p.featured).slice(0, 6);

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 md:grid-cols-2 md:pt-20">
        <div className="animate-fade-up">
          <p className="eyebrow">Fait main avec passion</p>
          <h1 className="mt-5 text-5xl leading-[1.05] md:text-7xl">
            L'élégance <br />d'un fil, <span className="font-script text-primary">tissé pour vous</span>
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Vêtements, sacs et accessoires en crochet, pensés pour elle comme pour lui. Chaque pièce est unique — et peut être créée selon vos envies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/boutique" className="btn-primary">Découvrir la boutique</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-outline"><WhatsAppIcon className="h-4 w-4" /> Commande personnalisée</a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-accent/50 rotate-2" />
          <img src={hero} alt="Créations en crochet Pati'" width={1600} height={1104} className="aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-soft" />
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-6xl px-5">
        <div className="text-center">
          <p className="eyebrow">Nos univers</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Explorer par catégorie</h2>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c, i) => (
            <Link key={c.id} to="/boutique" search={{ c: c.slug }}
              className={`group rounded-2xl border border-border p-6 transition hover:-translate-y-1 hover:shadow-soft ${["bg-secondary/60", "bg-muted", "bg-accent/40", "bg-sage/20"][i % 4]}`}>
              <p className="font-display text-sm text-primary">0{i + 1}</p>
              <h3 className="mt-8 text-2xl">{c.name}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
              <p className="mt-4 text-xs tracking-widest uppercase group-hover:text-primary">Voir →</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto mt-28 max-w-6xl px-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Coups de cœur</p>
              <h2 className="mt-3 text-4xl md:text-5xl">Pièces à l'honneur</h2>
            </div>
            <Link to="/boutique" className="hidden text-sm underline-offset-4 hover:underline md:block">Tout voir</Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <section className="mx-auto mt-28 max-w-4xl px-5 text-center">
        <p className="font-script text-4xl text-primary">Une idée ?</p>
        <h2 className="mt-2 text-4xl md:text-5xl">Créons ensemble votre pièce unique</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Couleurs, tailles, motifs : dites-nous tout sur WhatsApp, nous donnons vie à votre création.</p>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-primary mt-8"><WhatsAppIcon className="h-4 w-4" /> Discuter avec Pati'</a>
      </section>
    </>
  );
}
