import { createServerFn } from "@tanstack/react-start";
import type { Product, Category } from "./site";
import catalogJson from "./catalogData.json";

export interface CatalogStore {
  categories: Category[];
  products: Product[];
  deletedProductIds: string[];
  deletedCategoryIds: string[];
}

// Initial store extrait du JSON embarqué sans dépendance système de fichiers
const staticInitialStore: CatalogStore = {
  categories: (catalogJson as any).categories || [],
  products: (catalogJson as any).products || [],
  deletedProductIds: (catalogJson as any).deletedProductIds || [],
  deletedCategoryIds: (catalogJson as any).deletedCategoryIds || [],
};

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

  // 2. En environnement Node.js local (ex: dev local sur PC) : tenter de lire le fichier à jour
  try {
    if (typeof process !== "undefined" && process.versions?.node && !process.env["VERCEL"] && !process.env["NOW_REGION"]) {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const localFile = path.resolve(process.cwd(), "public", "data", "catalog.json");
      const raw = await fs.readFile(localFile, "utf-8");
      const parsed = JSON.parse(raw) as CatalogStore;
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
        globalThis.__PATI_SERVER_CATALOG__ = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback silencieux
  }

  // 3. Fallback garanti sur le store JSON embarqué
  globalThis.__PATI_SERVER_CATALOG__ = staticInitialStore;
  return staticInitialStore;
}

async function persistCatalogToStorage(store: CatalogStore): Promise<void> {
  globalThis.__PATI_SERVER_CATALOG__ = store;

  // Tentative d'écriture locale sécurisée si Node.js est disponible
  try {
    if (typeof process !== "undefined" && process.versions?.node && !process.env["VERCEL"] && !process.env["NOW_REGION"]) {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const serialized = JSON.stringify(store, null, 2);
      const localFile = path.resolve(process.cwd(), "public", "data", "catalog.json");
      const srcFile = path.resolve(process.cwd(), "src", "lib", "catalogData.json");
      await fs.writeFile(localFile, serialized, "utf-8").catch(() => {});
      await fs.writeFile(srcFile, serialized, "utf-8").catch(() => {});
    }
  } catch {
    // Ignoré sur Vercel serverless / read-only
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

    const deletedIds = new Set(store.deletedProductIds || []);
    deletedIds.delete(product.id);

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
