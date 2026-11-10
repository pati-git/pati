import type { Category, Product } from "./site";

const STORAGE_KEY_PRODUCTS = "crochet_by_pati_custom_products";
const STORAGE_KEY_CATEGORIES = "crochet_by_pati_custom_categories";
const STORAGE_KEY_DELETED_PRODUCTS = "crochet_by_pati_deleted_product_ids";
const STORAGE_KEY_DELETED_CATEGORIES = "crochet_by_pati_deleted_category_ids";

/* -------------------------------------------------------------
 * GESTION DES IDENTIFIANTS SUPPRIMÉS
 * ------------------------------------------------------------*/

export function getDeletedProductIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDeletedCategoryIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_CATEGORIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markProductAsDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(getDeletedProductIds());
    deleted.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_PRODUCTS, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.warn("Impossible d'enregistrer la suppression du produit :", err);
  }
}

function unmarkProductAsDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(getDeletedProductIds());
    if (deleted.delete(id)) {
      localStorage.setItem(STORAGE_KEY_DELETED_PRODUCTS, JSON.stringify(Array.from(deleted)));
    }
  } catch {
    // Ignore
  }
}

function markCategoryAsDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(getDeletedCategoryIds());
    deleted.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_CATEGORIES, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.warn("Impossible d'enregistrer la suppression de la catégorie :", err);
  }
}

function unmarkCategoryAsDeleted(id: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(getDeletedCategoryIds());
    if (deleted.delete(id)) {
      localStorage.setItem(STORAGE_KEY_DELETED_CATEGORIES, JSON.stringify(Array.from(deleted)));
    }
  } catch {
    // Ignore
  }
}

/* -------------------------------------------------------------
 * GESTION DES PRODUITS
 * ------------------------------------------------------------*/

export function getLocalStoredProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    const list: Product[] = raw ? JSON.parse(raw) : [];
    const deleted = new Set(getDeletedProductIds());
    return list.filter((p) => !deleted.has(p.id));
  } catch {
    return [];
  }
}

export function saveLocalStoredProduct(product: Product): Product[] {
  if (typeof window === "undefined") return [];
  try {
    unmarkProductAsDeleted(product.id);
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
    markProductAsDeleted(id);
    const existing = getLocalStoredProducts();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------
 * GESTION DES CATÉGORIES
 * ------------------------------------------------------------*/

export function getLocalStoredCategories(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const list: Category[] = raw ? JSON.parse(raw) : [];
    const deleted = new Set(getDeletedCategoryIds());
    return list.filter((c) => !deleted.has(c.id));
  } catch {
    return [];
  }
}

export function saveLocalStoredCategory(cat: Category): Category[] {
  if (typeof window === "undefined") return [];
  try {
    unmarkCategoryAsDeleted(cat.id);
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
    markCategoryAsDeleted(id);
    const existing = getLocalStoredCategories();
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
