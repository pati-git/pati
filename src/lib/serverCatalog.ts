import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";
import type { Product, Category } from "./site";
import { defaultProducts, defaultCategories } from "./defaultData";

export interface CatalogStore {
  categories: Category[];
  products: Product[];
  deletedProductIds: string[];
  deletedCategoryIds: string[];
}

// Fichiers de persistance
const LOCAL_CATALOG_FILE = path.resolve(process.cwd(), "public", "data", "catalog.json");
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

  // 2. Tenter de lire depuis le fichier local public/data/catalog.json
  try {
    const raw = await fs.readFile(LOCAL_CATALOG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CatalogStore;
    if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
      globalThis.__PATI_SERVER_CATALOG__ = parsed;
      return parsed;
    }
  } catch {
    // Si absent, tenter le dossier temporaire
  }

  // 3. Tenter de lire depuis /tmp (pour Vercel serverless)
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

  // Tentative d'écriture locale
  try {
    const dir = path.dirname(LOCAL_CATALOG_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_CATALOG_FILE, serialized, "utf-8");
  } catch {
    // Read-only filesystem sur serveur serverless (ex: Vercel)
  }

  // Tentative d'écriture dans /tmp pour serverless
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

