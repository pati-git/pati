import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { productQuery, categoriesQuery, productsQuery } from "@/lib/queries";
import { formatPrice, buildWhatsAppProductUrl, type Product } from "@/lib/site";
import { WhatsAppIcon } from "@/components/SiteChrome";
import { useWhatsApp } from "@/lib/whatsappContext";
import { ProductCard } from "@/components/ProductCard";
import {
  ArrowLeft,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  Heart,
  Truck,
  CheckCircle2,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/produit/$id")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!product) {
      throw notFound();
    }
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]);
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Crochet by Pati' Dagan` : "Détail de la création — Crochet by Pati'";
    const desc = p?.description ?? "Création crochet faite main avec passion par Pati' Dagan.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p?.image_url ? [{ property: "og:image", content: p.image_url }] : []),
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(id));
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: allProducts } = useSuspenseQuery(productsQuery);
  const { openForm, setSelectedProduct } = useWhatsApp();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen]);

  // Synchronise automatiquement ce produit comme produit sélectionné dans le WhatsApp flottant
  useEffect(() => {
    if (product) {
      setSelectedProduct(product);
    }
  }, [product, setSelectedProduct]);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-3xl font-display">Création introuvable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ce produit n'existe plus ou a été déplacé.
        </p>
        <Link to="/boutique" className="btn-primary mt-6">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.category_id);
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (!product.category_id || p.category_id === product.category_id))
    .slice(0, 3);

  const fallbackRelated = relatedProducts.length > 0
    ? relatedProducts
    : allProducts.filter((p) => p.id !== product.id).slice(0, 3);

  const whatsappDirectUrl = buildWhatsAppProductUrl(product);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
      {/* Barre de navigation / Bouton retour */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/boutique"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-medium text-foreground backdrop-blur-sm transition-all hover:bg-cocoa hover:text-primary-foreground hover:border-cocoa shadow-sm group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-primary group-hover:text-primary-foreground" />
          <span>Retour à la boutique</span>
        </Link>

        {/* Fil d'Ariane */}
        <nav className="hidden text-xs text-muted-foreground sm:flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <span>/</span>
          <Link to="/boutique" className="hover:text-foreground">Boutique</Link>
          {category && (
            <>
              <span>/</span>
              <Link to="/boutique" search={{ c: category.slug }} className="hover:text-foreground">
                {category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Grille principale du produit */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        {/* Colonne visuelle : Image agrandie avec zoom & Lightbox */}
        <div className="relative group">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-soft">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105 cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-accent/20 p-6 text-center">
                <span className="font-script text-6xl text-primary">Pati'</span>
                <span className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  Fait main avec passion
                </span>
              </div>
            )}

            {/* Badges sur l'image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.available ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-whatsapp animate-pulse" />
                  Disponible immédiatement
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Fait main sur commande
                </span>
              )}
            </div>

            {/* Bouton Agrandir */}
            {product.image_url && (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3.5 py-2 text-xs font-medium text-foreground backdrop-blur-md shadow-md transition hover:bg-cocoa hover:text-white"
                title="Agrandir la photo du produit"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Agrandir</span>
              </button>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            Cliquez sur l'image pour l'afficher en très haute résolution.
          </p>
        </div>

        {/* Colonne informations & Caractéristiques */}
        <div className="space-y-6">
          <div>
            {category && (
              <Link
                to="/boutique"
                search={{ c: category.slug }}
                className="eyebrow inline-block hover:underline mb-2"
              >
                {category.name}
              </Link>
            )}
            <h1 className="text-4xl sm:text-5xl font-display leading-tight text-foreground">
              {product.name}
            </h1>
            <div className="mt-4 flex items-baseline gap-4">
              <span className="font-display text-3xl font-semibold text-primary">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-muted-foreground">
                {product.price ? "TTC · Frais de port ajustés selon destination" : "Prix sur mesure"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm text-foreground/80 leading-relaxed">
            {product.description ? (
              <p className="text-base leading-relaxed">{product.description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Création artisanale unique réalisée à la main au fil de coton et laine douce par la créatrice Pati' Dagan.
              </p>
            )}
          </div>

          {/* Boutons d'action principaux (WhatsApp) */}
          <div className="pt-2 space-y-3">
            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-cocoa py-4 px-6 text-sm sm:text-base font-semibold text-primary-foreground shadow-soft transition hover:bg-primary hover:scale-[1.01] active:scale-95"
            >
              <WhatsAppIcon className="h-6 w-6 text-primary-foreground" />
              <span>Commander sur WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() =>
                openForm(
                  product,
                  `Bonjour Pati', je souhaite échanger sur les options de personnalisation pour la création « ${product.name} »`
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-full border border-cocoa bg-card/80 py-3.5 px-6 text-xs sm:text-sm font-medium text-cocoa transition hover:bg-cocoa hover:text-primary-foreground cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-cocoa" />
              <span>Personnaliser cette pièce (couleur, taille, mesures)</span>
            </button>

            <p className="text-[11px] text-center text-muted-foreground">
              💬 Réponse personnalisée de Pati' Dagan pour valider vos choix et modalités de livraison.
            </p>
          </div>

          {/* Tableau / Fiche détaillée des Caractéristiques */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-display border-b border-border pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Caractéristiques & Savoir-faire</span>
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Technique de fabrication
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  100% Crochet fait main (point d'artisanat)
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Matière & Fil
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  Coton peigné doux & laine durable de qualité
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Origine & Confection
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  Atelier Pati' Dagan · Calavi, Bénin 🇧🇯
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Disponibilité & Délais
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {product.available
                    ? "Pièce prête · Retrait/livraison immédiate"
                    : "Sur commande · Réalisé sous 3 à 7 jours"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Personnalisation
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  Couleurs et dimensions ajustables sur simple demande
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Conseil d'entretien
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  Lavage délicat à la main (eau froide), séchage à plat
                </dd>
              </div>
            </dl>
          </div>

          {/* Garanties artisanales */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/40 border border-border/60">
              <Heart className="h-5 w-5 text-primary mb-1.5" />
              <span className="text-[11px] font-medium">Pièce unique</span>
              <span className="text-[9px] text-muted-foreground">Tricotée avec soin</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/40 border border-border/60">
              <ShieldCheck className="h-5 w-5 text-primary mb-1.5" />
              <span className="text-[11px] font-medium">Fil résistant</span>
              <span className="text-[9px] text-muted-foreground">Doux au toucher</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/40 border border-border/60">
              <Truck className="h-5 w-5 text-primary mb-1.5" />
              <span className="text-[11px] font-medium">Livraison rapide</span>
              <span className="text-[9px] text-muted-foreground">Calavi & partout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Modal d'agrandissement en plein écran */}
      {isLightboxOpen && product.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-up"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-h-[92vh] max-w-4xl overflow-hidden rounded-2xl bg-card p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/70 p-2 text-white shadow-md transition hover:bg-black"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-[82vh] w-auto rounded-xl object-contain mx-auto"
            />
            <div className="p-3 text-center">
              <p className="font-display text-lg font-semibold">{product.name}</p>
              <p className="text-xs text-primary font-medium">{formatPrice(product.price)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions : Vous aimerez aussi */}
      {fallbackRelated.length > 0 && (
        <section className="mt-24 border-t border-border pt-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow">Découvrir d'autres pièces</p>
              <h2 className="text-3xl font-display mt-1">Vous aimerez aussi</h2>
            </div>
            <Link to="/boutique" className="text-xs sm:text-sm font-medium hover:text-primary underline-offset-4 hover:underline">
              Voir toute la boutique →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fallbackRelated.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
