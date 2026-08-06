-- ============================================================================
--  WAQQTI — migration_horaires.sql
--  Horaires d'ouverture configurables par salon. Non destructif, rejouable.
--  À coller dans Supabase → SQL Editor → Run.
-- ============================================================================

alter table public.salons add column if not exists heure_ouverture  time not null default '09:00';
alter table public.salons add column if not exists heure_fermeture  time not null default '19:00';
alter table public.salons add column if not exists pause_debut      time;           -- début pause déjeuner (optionnel)
alter table public.salons add column if not exists pause_fin        time;           -- fin pause déjeuner (optionnel)
alter table public.salons add column if not exists jours_fermes     int[] not null default '{}';  -- 0=dimanche … 6=samedi
alter table public.salons add column if not exists intervalle_creneaux int not null default 30
      check (intervalle_creneaux between 5 and 120);

-- ============================================================================
--  FIN — migration_horaires.sql
-- ============================================================================
