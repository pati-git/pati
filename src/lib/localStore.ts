import type { Category, Product } from "./site";

const STORAGE_KEY_PRODUCTS = "crochet_by_pati_custom_products";
const STORAGE_KEY_CATEGORIES = "crochet_by_pati_custom_categories";

export function getLocalStoredProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalStoredProduct(product: Product): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getLocalStoredProducts();
    const index = existing.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = product;
    } else {
      updated = [product, ...existing];
    }
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Impossible de sauvegarder localement le produit :", err);
    return [];
  }
}

export function deleteLocalStoredProduct(id: string): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getLocalStoredProducts();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getLocalStoredCategories(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalStoredCategory(cat: Category): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getLocalStoredCategories();
    const index = existing.findIndex((c) => c.id === cat.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = cat;
    } else {
      updated = [...existing, cat];
    }
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteLocalStoredCategory(id: string): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getLocalStoredCategories();
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

