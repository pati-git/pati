import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import hero from "@/assets/hero.jpg";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/SiteChrome";
import { useWhatsApp } from "@/lib/whatsappContext";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crochet by Pati — Créations crochet faites main" },
      { name: "description", content: "Vêtements, sacs et accessoires en crochet faits main et personnalisables, pour elle et pour lui à Calavi, Bénin." },
      { property: "og:title", content: "Crochet by Pati" },
      { property: "og:description", content: "Créations crochet élégantes, faites main avec passion." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: Index,
});

function Index() {
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const { refetch: refetchProducts } = useQuery(productsQuery);
  const { refetch: refetchCats } = useQuery(categoriesQuery);
  const { openForm } = useWhatsApp();

  // Forcer la synchronisation fraîche dès que le composant monte sur le client
  useEffect(() => {
    refetchProducts();
    refetchCats();
  }, [refetchProducts, refetchCats]);

  // Pièces en vedette : créations marquées en vedette
  const featuredOnly = products.filter((p) => p.featured);
  const displayFeatured = featuredOnly.length > 0 ? featuredOnly : products;
  const featuredIds = new Set(displayFeatured.map((p) => p.id));

  // Nouveautés complémentaires (toutes les autres créations sans doublons)
  const otherRecentProducts = products.filter((p) => !featuredIds.has(p.id));

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-5 pt-8 md:grid-cols-2 md:gap-10 md:pt-16 overflow-hidden">
        <div className="animate-fade-up">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display leading-[1.12]">
            L'élégance <br />d'un fil, <span className="font-script text-primary text-4xl sm:text-6xl md:text-7xl block sm:inline">tissé pour vous</span>
          </h1>

          {/* Image hero pour Mobile */}
          <div className="relative my-6 block md:hidden overflow-hidden rounded-2xl shadow-soft">
            <img
              src={hero}
              alt="Créations en crochet Pati"
              width={1024}
              height={1024}
              loading="eager"
              decoding="async"
              className="aspect-square w-full object-cover object-center"
            />
          </div>

          <p className="mt-5 max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
            Vêtements, sacs et accessoires uniques en crochet d'art, pensés pour elle comme pour lui. Chaque pièce est soigneusement confectionnée à la main et adaptable selon vos envies.
          </p>
          <div className="mt-6 flex flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3.5 w-full max-w-md">
            <Link
              to="/boutique"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-cocoa py-2.5 px-2.5 sm:py-3 sm:px-6 text-[10.5px] sm:text-xs md:text-sm font-medium tracking-tight sm:tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary active:scale-95 whitespace-nowrap text-center"
            >
              <span>Découvrir la boutique</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            </Link>
            <button
              type="button"
              onClick={() => openForm(null, "Je souhaite une commande de crochet personnalisée")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-cocoa py-2.5 px-2.5 sm:py-3 sm:px-6 text-[10.5px] sm:text-xs md:text-sm font-medium tracking-tight sm:tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary active:scale-95 cursor-pointer whitespace-nowrap text-center"
            >
              <WhatsAppIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>Commande personnalisée</span>
            </button>
          </div>
        </div>
        {/* Image hero pour Desktop */}
        <div className="relative hidden md:block">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-accent/40 rotate-2 transition duration-500 hover:rotate-1" />
          <img
            src={hero}
            alt="Créations en crochet Pati"
            width={1024}
            height={1024}
            loading="eager"
            decoding="async"
            className="aspect-square w-full rounded-[1.75rem] object-cover shadow-soft"
          />
        </div>
      </section>

      {/* Explorer par catégorie */}
      <section className="mx-auto mt-20 sm:mt-24 max-w-6xl px-5">
        <div className="text-center">
          <p className="eyebrow">Nos univers créatifs</p>
          <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-display">Explorer par catégorie</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {cats.map((c, i) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            return (
              <Link
                key={c.id}
                to="/boutique"
                search={{ c: c.slug }}
                className={`group rounded-2xl border border-border p-5 sm:p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft ${
                  ["bg-secondary/60", "bg-muted", "bg-accent/40", "bg-sage/20"][i % 4]
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm text-primary font-medium">0{i + 1}</p>
                  <span className="text-[11px] font-medium text-muted-foreground bg-card/60 px-2 py-0.5 rounded-full">
                    {count} création{count > 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="mt-5 text-xl sm:text-2xl font-display">{c.name}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                <p className="mt-4 text-xs font-semibold tracking-widest uppercase text-foreground/80 group-hover:text-primary transition">
                  Voir →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sélection coup de cœur (Pièces à l'honneur) */}
      {displayFeatured.length > 0 && (
        <section className="mx-auto mt-20 sm:mt-24 max-w-6xl px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Sélection coup de cœur</p>
              <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-display">Pièces à l'honneur</h2>
            </div>
            <Link
              to="/boutique"
              className="text-xs sm:text-sm font-medium underline-offset-4 hover:underline hover:text-primary whitespace-nowrap"
            >
              Voir toute la boutique →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayFeatured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Dernières créations complémentaires */}
      {otherRecentProducts.length > 0 && (
        <section className="mx-auto mt-20 sm:mt-24 max-w-6xl px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="eyebrow">Nouveautés de l'atelier</p>
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-display">Dernières créations</h2>
            </div>
            <Link
              to="/boutique"
              className="text-xs sm:text-sm font-medium underline-offset-4 hover:underline hover:text-primary whitespace-nowrap"
            >
              Toutes les pièces ({products.length}) →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherRecentProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Appel à l'action commande sur-mesure */}
      <section className="mx-auto mt-20 sm:mt-24 max-w-4xl px-5 text-center">
        <div className="rounded-3xl border border-border/70 bg-secondary/30 p-8 sm:p-12 shadow-sm">
          <p className="font-script text-3xl sm:text-4xl text-primary">Une idée particulière ?</p>
          <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-display">Créons ensemble votre pièce unique</h2>
          <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Couleurs, mensurations, modèles inspirants : partagez vos envies directement avec Pati sur WhatsApp, nous confectionnons sur-mesure votre création idéale.
          </p>
          <button
            type="button"
            onClick={() => openForm(null, "Bonjour Pati, j'aimerais créer une pièce unique sur-mesure.")}
            className="btn-primary mt-7 cursor-pointer"
          >
            <WhatsAppIcon className="h-4 w-4" /> Discuter avec Pati
          </button>
        </div>
      </section>
    </>
  );
}
