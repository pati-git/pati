import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/lib/site";
import { WhatsAppIcon } from "./SiteChrome";
import { useWhatsApp } from "@/lib/whatsappContext";

export function ProductCard({ p }: { p: Product }) {
  const { openForm } = useWhatsApp();

  return (
    <article className="group animate-fade-up flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md">
        <Link
          to="/produit/$id"
          params={{ id: p.id }}
          className="block h-full w-full cursor-pointer"
          aria-label={`Voir les caractéristiques de ${p.name}`}
        >
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent/20 font-script text-4xl text-primary">
              Pati
            </div>
          )}
        </Link>

        {/* Availability Badge */}
        {!p.available ? (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-sm text-foreground shadow-sm">
            Sur commande
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-sm text-foreground shadow-sm">
            Fait main
          </span>
        )}

        {/* Desktop Hover Action Overlay */}
        <div className="hidden sm:flex absolute inset-x-3 bottom-3 translate-y-3 flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            to="/produit/$id"
            params={{ id: p.id }}
            className="flex items-center justify-center rounded-full bg-card/95 py-2 text-xs font-medium text-foreground backdrop-blur-sm transition hover:bg-card hover:text-primary shadow-sm"
          >
            Voir les caractéristiques →
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openForm(p);
            }}
            className="flex items-center justify-center gap-1.5 rounded-full bg-cocoa py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary"
          >
            <WhatsAppIcon className="h-4 w-4" /> Commander
          </button>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg sm:text-xl transition group-hover:text-primary truncate">
            <Link to="/produit/$id" params={{ id: p.id }}>
              {p.name}
            </Link>
          </h3>
          {p.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {p.description}
            </p>
          )}
        </div>
        <p className="whitespace-nowrap font-medium text-sm text-primary shrink-0">
          {formatPrice(p.price)}
        </p>
      </div>

      {/* Mobile/Tablet Touch Action Buttons */}
      <div className="mt-2.5 flex sm:hidden items-center gap-2 pt-1">
        <Link
          to="/produit/$id"
          params={{ id: p.id }}
          className="flex-1 flex items-center justify-center rounded-full border border-border bg-card py-2 px-3 text-xs font-medium text-foreground shadow-xs active:bg-secondary"
        >
          Détails
        </Link>
        <button
          type="button"
          onClick={() => openForm(p)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-cocoa py-2 px-3 text-xs font-semibold text-primary-foreground shadow-xs active:bg-primary"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" /> Commander
        </button>
      </div>
    </article>
  );
}
