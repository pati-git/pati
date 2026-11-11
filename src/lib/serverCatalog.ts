import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";
import type { Product, Category } from "./site";
import { defaultProducts, defaultCategories } from "./defaultData";
import catalogSeed from "@/data/catalog.json";

export interface CatalogStore {
  categories: Category[];
  products: Product[];
  deletedProductIds: string[];
  deletedCategoryIds: string[];
}

// Fichiers de persistance
const SEED_CATALOG = catalogSeed as unknown as CatalogStore;
const TMP_CATALOG_FILE = path.resolve("/tmp", "crochet_pati_catalog.json");

// Cache mémoire serveur global partagé pendant l'exécution
declare global {
  // eslint-disable-next-line no-var
  var __PATI_SERVER_CATALOG__: CatalogStore | undefined;
}

async function readCatalogFromStorage(): Promise<CatalogStore> {
  // 1. Si déjà en mémoire vive du serveur
  if (globalThis.__PATI_SERVER_CATALOG__) {
    return globalThis.__PATI_SERVER_CATALOG__;
  }

  // 2. Tenter de lire l'état persistant de l'instance (serverless : /tmp)
  try {
    const rawTmp = await fs.readFile(TMP_CATALOG_FILE, "utf-8");
    const parsedTmp = JSON.parse(rawTmp) as CatalogStore;
    if (parsedTmp && Array.isArray(parsedTmp.products)) {
      globalThis.__PATI_SERVER_CATALOG__ = parsedTmp;
      return parsedTmp;
    }
  } catch {
    // Aucun fichier trouvé
  }

  // 3. Graine embarquée dans le bundle : identique en local et en production
  const seed = structuredClone(SEED_CATALOG);
  if (seed && Array.isArray(seed.products) && Array.isArray(seed.categories)) {
    globalThis.__PATI_SERVER_CATALOG__ = seed;
    return seed;
  }

  // 4. Initialisation par défaut
  const initialStore: CatalogStore = {
    categories: defaultCategories,
    products: defaultProducts,
    deletedProductIds: [],
    deletedCategoryIds: [],
  };
  globalThis.__PATI_SERVER_CATALOG__ = initialStore;
  return initialStore;
}

async function persistCatalogToStorage(store: CatalogStore): Promise<void> {
  globalThis.__PATI_SERVER_CATALOG__ = store;
  const serialized = JSON.stringify(store, null, 2);

  // Écriture de l'état de l'instance (serverless : /tmp, éphémère par instance)
  try {
    await fs.writeFile(TMP_CATALOG_FILE, serialized, "utf-8");
  } catch {
    // Ignore
  }
}

/* -------------------------------------------------------------
 * SERVER FUNCTIONS ACCESSIBLES CÔTÉ SERVEUR ET CLIENT
 * ------------------------------------------------------------*/

export const getCatalogServerFn = createServerFn({ method: "GET" }).handler(async () => {
  return await readCatalogFromStorage();
});

export const saveProductServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("product" in input)) {
      throw new Error("Produit invalide.");
    }
    return input as { product: Product };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const product = data.product;

    // Retirer des identifiants supprimés
    const deletedIds = new Set(store.deletedProductIds || []);
    deletedIds.delete(product.id);

    // Mettre à jour ou ajouter
    const list = [...store.products];
    const index = list.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.unshift(product);
    }

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
      deletedProductIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const toggleProductAvailabilityServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string; available?: boolean };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const list = store.products.map((p) => {
      if (p.id === data.id) {
        return {
          ...p,
          available: typeof data.available === "boolean" ? data.available : !p.available,
        };
      }
      return p;
    });

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const toggleProductFeaturedServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string; featured?: boolean };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const list = store.products.map((p) => {
      if (p.id === data.id) {
        return {
          ...p,
          featured: typeof data.featured === "boolean" ? data.featured : !p.featured,
        };
      }
      return p;
    });

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const deleteProductServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const id = data.id;

    const deletedIds = new Set(store.deletedProductIds || []);
    deletedIds.add(id);

    const list = store.products.filter((p) => p.id !== id);

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
      deletedProductIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const saveCategoryServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("category" in input)) {
      throw new Error("Catégorie invalide.");
    }
    return input as { category: Category };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const category = data.category;

    const deletedIds = new Set(store.deletedCategoryIds || []);
    deletedIds.delete(category.id);

    const list = [...store.categories];
    const index = list.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }

    const updatedStore: CatalogStore = {
      ...store,
      categories: list,
      deletedCategoryIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const deleteCategoryServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    const id = data.id;

    const deletedIds = new Set(store.deletedCategoryIds || []);
    deletedIds.add(id);

    const list = store.categories.filter((c) => c.id !== id);

    const updatedStore: CatalogStore = {
      ...store,
      categories: list,
      deletedCategoryIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

