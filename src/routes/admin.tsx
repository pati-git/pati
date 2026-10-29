import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { formatPrice, type Category, type Product } from "@/lib/site";
import { saveProductImageServerFn } from "@/lib/uploadImage";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Plus,
  Eye,
  LogOut,
  Edit3,
  Package,
  FolderTree,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Espace admin — Crochet by Pati" },
      { name: "description", content: "Gestion des produits et catégories de la boutique." },
      { property: "og:title", content: "Espace admin — Crochet by Pati" },
      { property: "og:description", content: "Gestion de la boutique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

async function compressImageToWebP(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Format d'image non valide ou fichier endommagé."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Traitement de l'image indisponible."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => resolve({ blob: b, dataUrl }))
                .catch(() => reject(new Error("Erreur de compression d'image.")));
            }
          },
          "image/webp",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return <div className="py-32 text-center text-muted-foreground">Chargement…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="py-32 text-center text-muted-foreground">Vérification…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <p>Ce compte n'a pas accès à l'administration.</p>
        <button className="btn-outline mt-6 cursor-pointer" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    );
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [email, setEmail] = useState("patricialdagan729@gmail.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setMsg("email_unconfirmed");
      } else if (error.message.includes("Invalid login credentials")) {
        setMsg("Email ou mot de passe incorrect.");
      } else {
        setMsg(error.message);
      }
    }
    setBusy(false);
  };

  const resendEmail = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setMsg(`Erreur lors du renvoi : ${error.message}`);
    } else {
      setMsg("Email de confirmation renvoyé ! Vérifiez votre boîte de réception et le dossier Spams/Courriers indésirables.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <p className="eyebrow">Espace propriétaire</p>
        <h1 className="mt-2 text-3xl font-display">Connexion Administrateur</h1>
        
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Compte unique vérifié • Inscriptions fermées</span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Accès exclusif réservé à l'administratrice de la boutique.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Email administrateur</label>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Mot de passe</label>
          <input
            className="field"
            type="password"
            placeholder="••••••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button className="btn-primary w-full cursor-pointer justify-center" disabled={busy}>
          {busy ? "Connexion en cours..." : "Se connecter"}
        </button>

        {msg === "email_unconfirmed" ? (
          <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 text-xs text-foreground space-y-2">
            <p className="font-semibold text-primary">Email non encore confirmé dans Supabase</p>
            <p className="text-muted-foreground leading-relaxed">
              L'email de vérification peut tarder ou se trouver dans vos spams.
            </p>
            <button
              type="button"
              onClick={resendEmail}
              disabled={busy}
              className="btn-outline w-full py-2 text-xs cursor-pointer justify-center"
            >
              Renvoyer l'email d'activation
            </button>
          </div>
        ) : (
          msg && <p className="text-center text-xs text-destructive font-medium">{msg}</p>
        )}

        <div className="pt-2 text-center border-t border-border/40">
          <p className="text-[11px] text-muted-foreground">
            🔒 Système sécurisé : aucune création de nouveau compte n'est autorisée.
          </p>
        </div>
      </form>
    </div>
  );
}

const emptyProduct = { id: "", name: "", description: "", price: "", category_id: "", image_url: "", featured: false, available: true };
type Draft = typeof emptyProduct;

function Dashboard({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    refresh();
  };

  const list = filter ? products.filter((p) => p.category_id === filter) : products;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 py-6 sm:py-12">
      {/* Barre d'en-tête responsive avec boutons d'accès réorganisés */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-xs p-4 sm:p-6 rounded-3xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              Espace Administration
            </span>
          </div>
          <h1 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-display font-semibold text-foreground">
            Mes créations
          </h1>
          <p className="text-xs text-muted-foreground break-all mt-0.5">{email}</p>
        </div>

        {/* Boutons d'accès : organisés clairement, responsive sur mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            className="btn-primary justify-center gap-2 text-xs sm:text-sm py-2.5 px-4 shadow-sm cursor-pointer"
            onClick={() => setDraft({ ...emptyProduct, category_id: cats[0]?.id ?? "" })}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>+ Ajouter un produit</span>
          </button>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <Link
              to="/boutique"
              className="btn-outline justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 text-center"
            >
              <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Boutique</span>
            </Link>
            <button
              type="button"
              className="btn-outline justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 cursor-pointer hover:border-destructive/40 hover:text-destructive"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques : DEUX PAR LIGNE sur tous les écrans */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        <Stat
          label="Total créations"
          value={products.length}
          icon={Package}
          hint="Créations enregistrées"
        />
        <Stat
          label="En vedette"
          value={products.filter((p) => p.featured).length}
          icon={Sparkles}
          hint="Sur la page d'accueil"
        />
        <Stat
          label="Disponibles"
          value={products.filter((p) => p.available).length}
          icon={CheckCircle2}
          hint="Prêtes à la vente"
        />
        <Stat
          label="Catégories"
          value={cats.length}
          icon={FolderTree}
          hint="Rayons de la boutique"
        />
      </div>

      <div className="mt-8 sm:mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <select
              className="field w-full sm:max-w-xs text-xs sm:text-sm font-medium"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Toutes les catégories ({products.length})</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({products.filter((p) => p.category_id === c.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            {list.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-secondary/15 transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-16 w-14 sm:h-18 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith("/images/sac.jpg")) {
                            target.src = "/images/sac.jpg";
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-script text-primary text-base">
                        Pati
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-display text-base sm:text-lg font-semibold text-foreground truncate max-w-[220px] sm:max-w-none">
                        {p.name}
                      </p>
                      {p.featured && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          ★ Vedette
                        </span>
                      )}
                      {!p.available && (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Sur commande
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {cats.find((c) => c.id === p.category_id)?.name ?? "Sans catégorie"} ·{" "}
                      <span className="font-semibold text-primary">{formatPrice(p.price)}</span>
                    </p>
                  </div>
                </div>

                {/* Boutons d'action : pleine largeur sur mobile, stylisés et protégés contre tout débordement */}
                <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:text-primary transition cursor-pointer shadow-xs active:scale-[0.98]"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        description: p.description ?? "",
                        price: p.price?.toString() ?? "",
                        category_id: p.category_id ?? "",
                        image_url: p.image_url ?? "",
                        featured: p.featured,
                        available: p.available,
                      })
                    }
                  >
                    <Edit3 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/5 hover:bg-destructive/15 px-3.5 py-2 text-xs font-semibold text-destructive transition cursor-pointer shadow-xs active:scale-[0.98]"
                    onClick={() => remove(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p>Aucun produit dans cette sélection.</p>
              </div>
            )}
          </div>
        </div>
        <CategoryManager cats={cats} onChange={refresh} />
      </div>

      {draft && <ProductForm draft={draft} cats={cats} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); refresh(); }} />}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon?: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs transition hover:border-primary/40">
      <div className="flex items-center justify-between gap-1">
        <p className="eyebrow text-muted-foreground text-[10px] sm:text-xs truncate">{label}</p>
        {Icon && <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary shrink-0" />}
      </div>
      <p className="mt-1 sm:mt-2 font-display text-2xl sm:text-4xl text-foreground font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

function ProductForm({ draft, cats, onClose, onSaved }: { draft: Draft; cats: Category[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_IMAGES = [
    { label: "Cardigan Terracotta", url: "/images/cardigan.jpg" },
    { label: "Bonnet Côtelé", url: "/images/bonnet.jpg" },
    { label: "Sac cabas", url: "/images/sac.jpg" },
    { label: "Pièce sur-mesure", url: "/images/custom.jpg" },
  ];

  const processFile = async (file: File) => {
    // 1. Validation du format
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
    const isImage = validTypes.includes(file.type) || file.type.startsWith("image/");
    if (!isImage) {
      setErr("Format non supporté. Formats acceptés : JPG, PNG, WEBP, GIF, AVIF.");
      return;
    }

    // 2. Validation de la taille (15 Mo max)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErr("La photo dépasse la taille maximale autorisée de 15 Mo. Veuillez sélectionner une photo plus légère.");
      return;
    }

    setUploading(true);
    setErr(null);

    try {
      setUploadStatus("Optimisation et compression WebP...");
      const { dataUrl } = await compressImageToWebP(file, 1200, 0.82);

      setUploadStatus("Enregistrement direct dans le dossier public du projet...");
      const cleanFileName = `${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;

      const res = await saveProductImageServerFn({
        data: {
          fileName: cleanFileName,
          base64Data: dataUrl,
        },
      });

      if (res?.imageUrl) {
        setD((prev) => ({ ...prev, image_url: res.imageUrl }));
      } else {
        throw new Error("Impossible d'obtenir l'URL de l'image enregistrée.");
      }
    } catch (uploadException: any) {
      console.error("Erreur lors de l'enregistrement local de la photo :", uploadException);
      setErr("Erreur d'enregistrement dans le dossier local du projet : " + (uploadException?.message || "Erreur inconnue"));
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const row = {
      name: d.name.trim(),
      description: d.description || null,
      price: d.price ? Number(d.price) : null,
      category_id: d.category_id || null,
      image_url: d.image_url || null,
      featured: d.featured,
      available: d.available,
    };
    const { error } = d.id
      ? await supabase.from("products").update(row).eq("id", d.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) {
      setErr(error.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 backdrop-blur-xs p-3 sm:p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-card p-4 sm:p-6 shadow-soft border border-border"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <h2 className="text-2xl font-display text-foreground">
            {d.id ? "Modifier le produit" : "Ajouter un produit"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl p-1 rounded-md"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <label className="block text-sm font-medium text-foreground">
          Nom du produit *
          <input
            className="field mt-1"
            placeholder="Ex: Sac cabas en crochet terracotta"
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            required
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Description
          <textarea
            className="field mt-1"
            rows={3}
            placeholder="Détails de la création, matière, dimensions..."
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-foreground">
            Prix (FCFA)
            <input
              className="field mt-1"
              type="number"
              min={0}
              placeholder="Sur devis si vide"
              value={d.price}
              onChange={(e) => setD({ ...d, price: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Catégorie
            <select
              className="field mt-1"
              value={d.category_id}
              onChange={(e) => setD({ ...d, category_id: e.target.value })}
            >
              <option value="">Aucune catégorie</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Zone d'ajout et prévisualisation de la photo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Photo du produit (stockée localement dans le projet)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{uploadStatus ?? "Chargement..."}</p>
              <p className="text-xs text-muted-foreground mt-1">Traitement et enregistrement dans le projet...</p>
            </div>
          ) : d.image_url ? (
            <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-3">
              <div className="relative overflow-hidden rounded-lg bg-black/5 aspect-4/3 max-h-56 flex items-center justify-center">
                <img
                  src={d.image_url}
                  alt="Prévisualisation"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    // Repli visuel si le chemin est incorrect
                    (e.currentTarget as HTMLImageElement).src = "/images/sac.jpg";
                  }}
                />
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium min-w-0">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Photo prête et optimisée</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-outline flex-1 sm:flex-initial text-xs py-1.5 px-3 cursor-pointer justify-center"
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      onClick={() => setD({ ...d, image_url: "" })}
                      className="inline-flex items-center justify-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded-lg px-2.5 py-1.5 border border-destructive/20 cursor-pointer"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Retirer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border/80 hover:border-primary/60 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2.5">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Cliquez pour importer une photo ou glissez-déposez
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formats acceptés : <span className="font-medium text-foreground">JPG, PNG, WEBP, GIF, AVIF</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Stockage local haute vitesse dans <code className="text-primary font-medium">public/images/products/</code>
              </p>
            </div>
          )}

          {/* Raccourcis photos existantes du projet */}
          <div className="mt-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              Ou choisir parmi les photos existantes du projet :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setD({ ...d, image_url: preset.url })}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    d.image_url === preset.url
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border/70 bg-card hover:bg-secondary/70 text-foreground"
                  }`}
                >
                  <ImageIcon className="h-3 w-3 text-primary shrink-0" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary h-4 w-4 rounded"
              checked={d.featured}
              onChange={(e) => setD({ ...d, featured: e.target.checked })}
            />
            <span className="font-medium text-foreground">⭐ Mettre en vedette (accueil)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary h-4 w-4 rounded"
              checked={d.available}
              onChange={(e) => setD({ ...d, available: e.target.checked })}
            />
            <span className="font-medium text-foreground">Disponible à la vente</span>
          </label>
        </div>

        {err && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{err}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-border/60">
          <button
            type="button"
            className="btn-outline w-full sm:w-auto cursor-pointer justify-center py-2.5 px-4"
            onClick={onClose}
            disabled={busy || uploading}
          >
            Annuler
          </button>
          <button
            className="btn-primary w-full sm:w-auto cursor-pointer justify-center py-2.5 px-5 font-semibold"
            disabled={busy || uploading}
          >
            {busy ? "Enregistrement..." : d.id ? "Mettre à jour" : "Créer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoryManager({ cats, onChange }: { cats: Category[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const add = async (e: FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    await supabase.from("categories").insert({ name: name.trim(), slug: `${slugify(name)}-${Date.now().toString(36)}`, position: cats.length + 1 });
    setName(""); onChange();
  };
  const rename = async (c: Category) => {
    const n = prompt("Nouveau nom", c.name); if (!n?.trim()) return;
    await supabase.from("categories").update({ name: n.trim() }).eq("id", c.id); onChange();
  };
  const del = async (c: Category) => {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ? Les produits resteront sans catégorie.`)) return;
    await supabase.from("categories").delete().eq("id", c.id); onChange();
  };
  return (
    <aside className="h-fit rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">Catégories</h2>
        </div>
        <span className="text-xs bg-secondary px-2.5 py-0.5 rounded-full text-foreground font-semibold">
          {cats.length}
        </span>
      </div>
      <ul className="mt-3.5 space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/30 px-3 py-2 text-sm border border-border/40">
            <span className="truncate font-medium text-foreground text-xs sm:text-sm">{c.name}</span>
            <span className="flex items-center gap-1.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => rename(c)}
                className="text-xs text-muted-foreground hover:text-primary transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-secondary"
              >
                Renommer
              </button>
              <button
                type="button"
                onClick={() => del(c)}
                className="h-6 w-6 inline-flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition cursor-pointer font-bold"
                title="Supprimer la catégorie"
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          className="field text-xs sm:text-sm flex-1 min-w-0"
          placeholder="Nouvelle catégorie"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary px-3 sm:px-4 cursor-pointer shrink-0 font-semibold"
          title="Ajouter la catégorie"
        >
          +
        </button>
      </form>
    </aside>
  );
}
