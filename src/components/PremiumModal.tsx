import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Trash2, Edit3, X } from "lucide-react";
import type { Product, Category } from "@/lib/site";
import { formatPrice } from "@/lib/site";

/* -------------------------------------------------------------
 * MODAL DE CONFIRMATION PREMIUM (SUPPRESSION PRODUIT / CATÉGORIE)
 * ------------------------------------------------------------*/

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  product?: Product | null;
  category?: Category | null;
}

export function PremiumConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  eyebrow = "Confirmation requise",
  confirmLabel = "Supprimer définitivement",
  cancelLabel = "Conserver",
  variant = "danger",
  product,
  category,
}: ConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa/60 backdrop-blur-sm transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft transition-all transform animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icône et Badge thématiques */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border ${
              variant === "danger"
                ? "bg-destructive/10 text-destructive border-destructive/25"
                : "bg-primary/10 text-primary border-primary/25"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {/* Aperçu du produit si spécifié */}
        {product && (
          <div className="my-4 flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/35 p-3">
            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
              <img
                src={product.image_url || "/images/products/sac.webp"}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/products/sac.webp";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-foreground truncate">
                {product.name}
              </p>
              <p className="text-xs text-primary font-medium mt-0.5">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        )}

        {/* Aperçu de la catégorie si spécifiée */}
        {category && !product && (
          <div className="my-4 rounded-2xl border border-border/80 bg-secondary/35 px-4 py-3">
            <p className="text-xs text-muted-foreground">Rayon concerné :</p>
            <p className="font-display text-lg font-semibold text-foreground truncate mt-0.5">
              {category.name}
            </p>
          </div>
        )}

        {/* Message d'explication */}
        {message && (
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline w-full sm:flex-1 cursor-pointer justify-center py-2.5 px-4 text-xs font-semibold tracking-wider uppercase"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-semibold tracking-wider uppercase transition cursor-pointer shadow-sm active:scale-95 ${
              variant === "danger"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-cocoa text-primary-foreground hover:bg-primary"
            }`}
          >
            {variant === "danger" && <Trash2 className="h-3.5 w-3.5 shrink-0" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * MODAL DE SAISIE PREMIUM (RENOMMER CATÉGORIE)
 * ------------------------------------------------------------*/

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  eyebrow?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function PremiumPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  eyebrow = "Modification",
  defaultValue = "",
  placeholder = "Entrez le nouveau nom...",
  confirmLabel = "Enregistrer",
  cancelLabel = "Annuler",
}: PromptModalProps) {
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(defaultValue);
  }, [defaultValue, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    onSubmit(val.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa/60 backdrop-blur-sm transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft transition-all transform animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* En-tête */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25">
            <Edit3 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {message && (
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        )}

        {/* Champ de saisie */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Nom de la catégorie
          </label>
          <input
            ref={inputRef}
            type="text"
            className="field w-full text-sm font-medium"
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            required
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline w-full sm:flex-1 cursor-pointer justify-center py-2.5 px-4 text-xs font-semibold tracking-wider uppercase"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!val.trim()}
            className="btn-primary w-full sm:flex-1 cursor-pointer justify-center py-2.5 px-4 text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

