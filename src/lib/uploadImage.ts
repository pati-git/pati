import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";

export interface SaveProductImageInput {
  fileName: string;
  base64Data: string;
}

export const saveProductImageServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Données d'image invalides.");
    }
    const { fileName, base64Data } = input as { fileName?: string; base64Data?: string };
    if (!fileName || !base64Data) {
      throw new Error("Nom de fichier ou contenu de l'image manquant.");
    }
    return { fileName, base64Data };
  })
  .handler(async ({ data }) => {
    // Sur Vercel ou tout environnement serverless (où le système de fichiers est en lecture seule),
    // l'image WebP ultra-optimisée est conservée directement en format autonome, garantissant
    // un chargement instantané sans aucune dépendance de stockage externe ni risque d'erreur 404/400.
    if (process.env["VERCEL"] || process.env["NOW_REGION"]) {
      return {
        imageUrl: data.base64Data,
      };
    }

    try {
      const cleanBase64 = data.base64Data.replace(/^data:image\/[a-z0-9.+]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      const targetDir = path.resolve(process.cwd(), "public", "images", "products");
      await fs.mkdir(targetDir, { recursive: true });

      const safeBaseName = data.fileName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      const uniqueFileName = `${Date.now()}-${safeBaseName}`;
      const destinationPath = path.join(targetDir, uniqueFileName);

      await fs.writeFile(destinationPath, buffer);

      // En environnement avec disque persistant (local / serveur dédié) : chemin public relatif
      return {
        imageUrl: `/images/products/${uniqueFileName}`,
      };
    } catch (writeErr) {
      console.warn("Écriture disque impossible (système de fichiers en lecture seule), utilisation directe du WebP :", writeErr);
      return {
        imageUrl: data.base64Data,
      };
    }
  });
