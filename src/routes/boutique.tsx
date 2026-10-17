import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/boutique")({
  validateSearch: (s: Record<string, unknown>) => ({ c: typeof s.c === "string" ? s.c : undefined }),
  head: () => ({
    meta: [
      { title: "Boutique — Crochet by Pati' Dagan" },
      { name: "description", content: "Toutes nos créations crochet par catégorie : vêtements, sacs, accessoires et pièces personnalisées." },
      { property: "og:title", content: "Boutique — Crochet by Pati' Dagan" },
      { property: "og:description", content: "Découvrez nos créations crochet faites main." },
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
    <div className="mx-auto max-w-6xl px-5 pt-14">
      <p className="eyebrow">La boutique</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Nos créations</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/boutique" search={{ c: undefined }} className={`rounded-full border px-4 py-2 text-sm ${!c ? "bg-cocoa text-primary-foreground border-cocoa" : "border-border"}`}>Tout</Link>
        {cats.map((x) => (
          <Link key={x.id} to="/boutique" search={{ c: x.slug }} className={`rounded-full border px-4 py-2 text-sm ${c === x.slug ? "bg-cocoa text-primary-foreground border-cocoa" : "border-border"}`}>{x.name}</Link>
        ))}
      </div>

      {shown.map((cat) => {
        const items = products.filter((p) => p.category_id === cat.id);
        return (
          <section key={cat.id} className="mt-16">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <h2 className="text-3xl">{cat.name}</h2>
              <span className="text-xs text-muted-foreground">{items.length} pièce{items.length > 1 ? "s" : ""}</span>
            </div>
            {items.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">Bientôt de nouvelles créations ici.</p>
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            )}
          </section>
        );
      })}
      {!c && uncategorized.length > 0 && (
        <section className="mt-16">
          <h2 className="border-b border-border pb-3 text-3xl">Autres créations</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{uncategorized.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </div>
  );
}
