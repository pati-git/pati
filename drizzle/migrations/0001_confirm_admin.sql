-- Confirme automatiquement le compte admin de Patricia
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'patricialdagan729@gmail.com';

-- Assure que le rôle admin est bien attribué
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'patricialdagan729@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Création du bucket de stockage pour les photos des produits (10 Mo maxi)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permettre la lecture publique des photos des produits
DROP POLICY IF EXISTS "public read product images" ON storage.objects;
CREATE POLICY "public read product images" 
ON storage.objects FOR SELECT TO anon, authenticated 
USING (bucket_id = 'product-images');

-- Permettre la gestion des photos par l'administrateur
DROP POLICY IF EXISTS "admin upload imgs" ON storage.objects;
CREATE POLICY "admin upload imgs" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin update imgs" ON storage.objects;
CREATE POLICY "admin update imgs" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin delete imgs" ON storage.objects;
CREATE POLICY "admin delete imgs" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
