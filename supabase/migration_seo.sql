-- ════════════════════════════════════════════════════════════════════
-- Waqqti — migration SEO : salons de démonstration
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
--
-- Ajoute la case « demo » aux salons. Un salon démo reste visible par
-- lien (présentations, vérificateurs Apple/Google) mais n'est JAMAIS
-- envoyé à Google (pas dans le sitemap, balise « noindex »).
-- ════════════════════════════════════════════════════════════════════

alter table public.salons add column if not exists demo boolean not null default false;

comment on column public.salons.demo is
  'Salon de démonstration : visible par lien, jamais indexé par Google.';

-- Aujourd'hui, tous les salons existants sont des salons de test :
-- on les marque tous comme démo. Les prochains salons créés seront
-- « réels » par défaut (demo = false).
update public.salons set demo = true;

-- Vérification :
--   select nom, slug, demo from public.salons order by nom;
-- Le jour où un vrai salon signe et que tu veux réutiliser un salon existant :
--   update public.salons set demo = false where slug = 'le-slug-du-salon';
