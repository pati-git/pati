import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Sparkles } from "lucide-react";

export type BoutiqueSearch = {
  c?: string | undefined;
};

export const Route = createFileRoute("/boutique")({
  validateSearch: (s: Record<string, unknown>): BoutiqueSearch => ({
    c: typeof s["c"] === "string" ? (s["c"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Boutique — Crochet by Pati' Dagan" },
      { name: "description", content: "Toutes nos créations crochet faites main : vêtements, sacs, accessoires et commandes sur-mesure." },
      { property: "og:title", content: "Boutique — Crochet by Pati' Dagan" },
      { property: "og:description", content: "Découvrez toutes nos pièces crochet faites main avec passion." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(productsQuery)]),
  component: Boutique,
});

function Boutique() {
  const { c } = Route.useSearch();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const shown = c ? cats.filter((x) => x.slug === c) : cats;
  const uncategorized = products.filter((p) => !p.category_id || !cats.some((x) => x.id === p.category_id));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      {/* Bouton retour vers l'accueil */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-medium tracking-wide text-foreground backdrop-blur-sm transition-all hover:bg-cocoa hover:text-primary-foreground hover:border-cocoa shadow-sm group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-primary group-hover:text-primary-foreground" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="eyebrow">La boutique officielle</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display">Nos créations artisanales</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          Chaque création est tricotée et crochetée à la main avec amour. Cliquez sur une pièce pour voir ses caractéristiques en détail ou commander directement sur WhatsApp.
        </p>
      </div>

      {/* Filtres par catégories */}
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          to="/boutique"
          search={() => ({} as BoutiqueSearch)}
          className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition ${
            !c ? "bg-cocoa text-primary-foreground border-cocoa shadow-sm" : "border-border bg-card hover:bg-secondary/70 text-foreground"
          }`}
        >
          Toutes les pièces ({products.length})
        </Link>
        {cats.map((x) => {
          const count = products.filter((p) => p.category_id === x.id).length;
          return (
            <Link
              key={x.id}
              to="/boutique"
              search={{ c: x.slug }}
              className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition ${
                c === x.slug
                  ? "bg-cocoa text-primary-foreground border-cocoa shadow-sm"
                  : "border-border bg-card hover:bg-secondary/70 text-foreground"
              }`}
            >
              {x.name} <span className="opacity-70 text-[11px]">({count})</span>
            </Link>
          );
        })}
      </div>

      {/* Liste des sections de catégories */}
      {shown.map((cat) => {
        const items = products.filter((p) => p.category_id === cat.id);
        return (
          <section key={cat.id} className="mt-14 sm:mt-16">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display">{cat.name}</h2>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {items.length} pièce{items.length > 1 ? "s" : ""}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground bg-secondary/20 rounded-2xl mt-6">
                <Sparkles className="h-6 w-6 text-primary mx-auto mb-2 opacity-60" />
                <p>Bientôt de nouvelles créations disponibles dans cette catégorie.</p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {!c && uncategorized.length > 0 && (
        <section className="mt-16">
          <h2 className="border-b border-border pb-3 text-2xl sm:text-3xl font-display">Autres créations</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorized.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
