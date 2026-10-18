-- Confirme automatiquement le compte admin de Patricia et tout compte futur
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'patricialdagan729@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'patricialdagan729@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
