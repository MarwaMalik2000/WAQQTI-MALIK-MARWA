-- ============================================================================
--  WAQQTI — schema.sql
--  Base de données Supabase (PostgreSQL) — prête à coller dans le SQL Editor.
--  Ordre : extensions → tables → index → triggers → fonctions (Kill Switch,
--          sièges, acompte) → Storage → RLS/policies → salon démo.
--
--  Cohérent avec le code existant :
--    salons(slug, nom, adresse, wilaya, telephone, formule, nb_sieges, actif,
--           trial_end_date, mode_reservation, owner)
--    prestations(salon_id, nom, categorie, ordre, prix, duree_minutes, actif)
--    employes(salon_id, nom, actif, ordre)
--    reservations(salon_id, employe_id, prestation_id, prestation_nom,
--                 duree_minutes, prix, client_nom, client_telephone,
--                 date_rdv, notes, statut, source)
--  Modèle : essai 30j → Kill Switch. Prix en DA. Pas de passerelle de paiement.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist";  -- exclusion anti-chevauchement

-- ── Types ────────────────────────────────────────────────────────────────────
do $$ begin
  create type formule_t   as enum ('trial','essentielle','confort','premium');
exception when duplicate_object then null; end $$;
do $$ begin
  create type mode_resa_t  as enum ('creneau','journee');
exception when duplicate_object then null; end $$;
do $$ begin
  create type statut_resa_t as enum ('confirme','annule','termine','no_show','en_attente');
exception when duplicate_object then null; end $$;
do $$ begin
  create type acompte_statut_t as enum ('non_requis','en_attente','recu','refuse');
exception when duplicate_object then null; end $$;

-- ============================================================================
--  TABLES
-- ============================================================================

-- ── Salons (les clients payants) ─────────────────────────────────────────────
create table if not exists public.salons (
  id              uuid primary key default gen_random_uuid(),
  owner           uuid references auth.users(id) on delete set null, -- gérant (auth)
  nom             text not null,
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  telephone       text,
  wilaya          text,
  adresse         text,
  formule         formule_t  not null default 'trial',
  mode_reservation mode_resa_t not null default 'creneau',
  nb_sieges       int not null default 1 check (nb_sieges between 1 and 50),
  actif           boolean not null default true,
  trial_end_date  timestamptz,                 -- rempli à la création (essai 30j)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_salons_slug on public.salons(slug);
create index if not exists idx_salons_owner on public.salons(owner);

-- ── Prestations (contenu métier : TOUJOURS en français) ──────────────────────
create table if not exists public.prestations (
  id            uuid primary key default gen_random_uuid(),
  salon_id      uuid not null references public.salons(id) on delete cascade,
  nom           text not null,
  categorie     text default 'Général',
  ordre         int  default 0,
  prix          numeric(10,2) not null default 0,     -- en DA
  duree_minutes int not null default 30 check (duree_minutes between 5 and 600),
  actif         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_prestations_salon on public.prestations(salon_id);

-- ── Équipe (profils employés — visibles dès la formule Confort) ──────────────
create table if not exists public.employes (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid not null references public.salons(id) on delete cascade,
  nom        text not null,
  ordre      int default 0,
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_employes_salon on public.employes(salon_id);

-- ── Exceptions de sièges (fermeture / capacité réduite un jour donné) ────────
create table if not exists public.siege_exceptions (
  id        uuid primary key default gen_random_uuid(),
  salon_id  uuid not null references public.salons(id) on delete cascade,
  jour      date not null,
  capacite  int  not null default 0 check (capacite >= 0), -- 0 = fermé
  motif     text,
  unique (salon_id, jour)
);
create index if not exists idx_siege_exc_salon on public.siege_exceptions(salon_id, jour);

-- ── Réservations ─────────────────────────────────────────────────────────────
create table if not exists public.reservations (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid not null references public.salons(id) on delete cascade,
  employe_id     uuid references public.employes(id) on delete set null,
  prestation_id  uuid references public.prestations(id) on delete set null,
  prestation_nom text,                          -- figé au moment du RDV
  duree_minutes  int  not null default 30,
  prix           numeric(10,2) default 0,       -- en DA
  client_nom     text not null,
  client_telephone text,                        -- format +213… (LTR)
  date_rdv       timestamptz not null,
  notes          text,
  statut         statut_resa_t not null default 'confirme',
  source         text default 'public' check (source in ('public','pro')),
  -- Acompte (déclaratif : preuve de paiement, pas de passerelle) --------------
  acompte_statut   acompte_statut_t not null default 'non_requis',
  acompte_montant  numeric(10,2),
  acompte_deadline timestamptz,
  justificatif_url text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_resa_salon_date on public.reservations(salon_id, date_rdv);
create index if not exists idx_resa_employe     on public.reservations(employe_id, date_rdv);

-- ============================================================================
--  TRIGGERS
-- ============================================================================

-- updated_at auto
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_salons_touch on public.salons;
create trigger trg_salons_touch before update on public.salons
  for each row execute function public.touch_updated_at();

-- À la création d'un salon en essai : fixe la fin d'essai à +30 jours
create or replace function public.set_trial_end()
returns trigger language plpgsql as $$
begin
  if new.formule = 'trial' and new.trial_end_date is null then
    new.trial_end_date := now() + interval '30 days';
  end if;
  return new;
end $$;

drop trigger if exists trg_salons_trial on public.salons;
create trigger trg_salons_trial before insert on public.salons
  for each row execute function public.set_trial_end();

-- ============================================================================
--  FONCTIONS MÉTIER
-- ============================================================================

-- ── KILL SWITCH ──────────────────────────────────────────────────────────────
-- Renvoie TRUE si le salon est accessible (actif + essai non expiré / abonné).
-- Utilisée à la fois dans les policies RLS et appelable via .rpc('verifier_acces_salon').
create or replace function public.verifier_acces_salon(p_salon_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select s.actif
       and (s.formule <> 'trial'
            or s.trial_end_date is null
            or s.trial_end_date > now())
    from public.salons s
    where s.id = p_salon_id
  ), false);
$$;

-- ── Créneaux déjà pris (RPC durci, sans exposer les données clients) ─────────
-- Recommandé pour la page publique : renvoie uniquement les plages occupées.
create or replace function public.get_creneaux_pris(p_salon_id uuid, p_jour date, p_employe_id uuid default null)
returns table (date_rdv timestamptz, duree_minutes int, employe_id uuid)
language sql stable security definer set search_path = public as $$
  select r.date_rdv, r.duree_minutes, r.employe_id
  from public.reservations r
  where r.salon_id = p_salon_id
    and r.statut <> 'annule'
    and r.date_rdv::date = p_jour
    and (p_employe_id is null or r.employe_id = p_employe_id);
$$;

-- ── Échéance d'acompte (4 tranches, plafonnée à 30 min avant le RDV) ─────────
--   < 6h → 1h · 6–48h → 6h · 48h–7j → 24h · > 7j → 48h
create or replace function public.acompte_deadline(p_date_rdv timestamptz)
returns timestamptz
language plpgsql immutable as $$
declare v_h numeric; v_delai interval; v_deadline timestamptz;
begin
  v_h := extract(epoch from (p_date_rdv - now())) / 3600.0;
  if    v_h < 6   then v_delai := interval '1 hour';
  elsif v_h < 48  then v_delai := interval '6 hours';
  elsif v_h < 168 then v_delai := interval '24 hours';
  else                 v_delai := interval '48 hours';
  end if;
  v_deadline := now() + v_delai;
  -- jamais après 30 min avant le RDV
  if v_deadline > p_date_rdv - interval '30 minutes' then
    v_deadline := p_date_rdv - interval '30 minutes';
  end if;
  return v_deadline;
end $$;

-- ── Réservation avec gestion de sièges (anti-surbooking, formule Essentielle) ─
-- Vérifie le Kill Switch + la capacité (nb_sieges ou exception du jour), puis insère.
create or replace function public.reserver_siege(
  p_salon_id      uuid,
  p_prestation_id uuid,
  p_prestation_nom text,
  p_duree         int,
  p_prix          numeric,
  p_client_nom    text,
  p_client_tel    text,
  p_date_rdv      timestamptz,
  p_notes         text default null,
  p_employe_id    uuid default null
) returns public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_salon    public.salons;
  v_capacite int;
  v_occupes  int;
  v_row      public.reservations;
begin
  select * into v_salon from public.salons where id = p_salon_id;
  if not found then raise exception 'Salon introuvable'; end if;

  if not public.verifier_acces_salon(p_salon_id) then
    raise exception 'Salon indisponible (essai expiré ou compte désactivé)'
      using errcode = 'P0001';
  end if;

  -- Capacité du jour : exception éventuelle, sinon nb_sieges
  select coalesce(
      (select capacite from public.siege_exceptions
        where salon_id = p_salon_id and jour = (p_date_rdv at time zone 'UTC')::date),
      v_salon.nb_sieges, 1)
    into v_capacite;
  if v_capacite <= 0 then raise exception 'Salon fermé ce jour'; end if;

  -- Comptage des occupations
  if v_salon.mode_reservation = 'journee' then
    select count(*) into v_occupes
      from public.reservations
     where salon_id = p_salon_id and statut <> 'annule'
       and date_rdv::date = p_date_rdv::date;
  else
    select count(*) into v_occupes
      from public.reservations
     where salon_id = p_salon_id and statut <> 'annule'
       and tstzrange(date_rdv, date_rdv + make_interval(mins => duree_minutes))
        && tstzrange(p_date_rdv, p_date_rdv + make_interval(mins => p_duree));
  end if;

  if v_occupes >= v_capacite then
    raise exception 'Complet : plus de siège disponible sur ce créneau'
      using errcode = 'P0002';
  end if;

  insert into public.reservations(
      salon_id, employe_id, prestation_id, prestation_nom, duree_minutes, prix,
      client_nom, client_telephone, date_rdv, notes, statut, source)
  values (
      p_salon_id, p_employe_id, p_prestation_id, p_prestation_nom, p_duree, p_prix,
      p_client_nom, p_client_tel, p_date_rdv, p_notes, 'confirme', 'public')
  returning * into v_row;

  return v_row;
end $$;

-- ============================================================================
--  STORAGE — bucket des justificatifs d'acompte
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('justificatifs', 'justificatifs', false)
on conflict (id) do nothing;

-- Lecture/écriture des justificatifs réservée au propriétaire du salon.
-- Convention de chemin : justificatifs/{salon_id}/{reservation_id}.ext
drop policy if exists "justif owner all" on storage.objects;
create policy "justif owner all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'justificatifs'
    and exists (
      select 1 from public.salons s
      where s.owner = auth.uid()
        and (storage.foldername(name))[1] = s.id::text
    )
  )
  with check (
    bucket_id = 'justificatifs'
    and exists (
      select 1 from public.salons s
      where s.owner = auth.uid()
        and (storage.foldername(name))[1] = s.id::text
    )
  );

-- ============================================================================
--  RLS + POLICIES
-- ============================================================================
alter table public.salons           enable row level security;
alter table public.prestations      enable row level security;
alter table public.employes         enable row level security;
alter table public.siege_exceptions enable row level security;
alter table public.reservations     enable row level security;

-- ── SALONS ───────────────────────────────────────────────────────────────────
-- Lecture publique des salons actifs (pour la page de réservation)
drop policy if exists "salons read public" on public.salons;
create policy "salons read public" on public.salons
  for select to anon, authenticated
  using (actif = true);

-- Le gérant gère SON salon
drop policy if exists "salons owner update" on public.salons;
create policy "salons owner update" on public.salons
  for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
-- NB : la CRÉATION des salons se fait par toi (admin) via la clé service_role,
--      qui contourne les RLS. Aucune policy INSERT publique = personne d'autre
--      ne peut créer de salon.

-- ── PRESTATIONS ──────────────────────────────────────────────────────────────
drop policy if exists "prest read public" on public.prestations;
create policy "prest read public" on public.prestations
  for select to anon, authenticated
  using (
    actif = true and exists (
      select 1 from public.salons s where s.id = salon_id and s.actif = true
    )
  );

drop policy if exists "prest owner all" on public.prestations;
create policy "prest owner all" on public.prestations
  for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()));

-- ── EMPLOYES ─────────────────────────────────────────────────────────────────
drop policy if exists "emp read public" on public.employes;
create policy "emp read public" on public.employes
  for select to anon, authenticated
  using (
    actif = true and exists (
      select 1 from public.salons s where s.id = salon_id and s.actif = true
    )
  );

drop policy if exists "emp owner all" on public.employes;
create policy "emp owner all" on public.employes
  for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()));

-- ── SIEGE_EXCEPTIONS (gérant uniquement) ─────────────────────────────────────
drop policy if exists "siege owner all" on public.siege_exceptions;
create policy "siege owner all" on public.siege_exceptions
  for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()));

-- ── RESERVATIONS ─────────────────────────────────────────────────────────────
-- Création publique d'un RDV : autorisée UNIQUEMENT si le Kill Switch passe.
drop policy if exists "resa insert public" on public.reservations;
create policy "resa insert public" on public.reservations
  for insert to anon, authenticated
  with check (source = 'public' and public.verifier_acces_salon(salon_id));

-- Lecture publique des créneaux (nécessaire au calcul des disponibilités).
--  ⚠️ TRADE-OFF : rend les colonnes de reservations lisibles par anon pour un
--     salon actif. La page publique ne lit que date_rdv/duree/employe_id.
--     ➜ POUR DURCIR : supprime cette policy et fais lire les dispos via
--        .rpc('get_creneaux_pris', {...}) (fonction fournie ci-dessus),
--        qui n'expose jamais nom/téléphone client.
drop policy if exists "resa read public creneaux" on public.reservations;
create policy "resa read public creneaux" on public.reservations
  for select to anon, authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.actif = true));

-- Le gérant gère toutes les résa de SON salon
drop policy if exists "resa owner all" on public.reservations;
create policy "resa owner all" on public.reservations
  for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner = auth.uid()));

-- Droit d'exécuter les RPC depuis le navigateur
grant execute on function public.verifier_acces_salon(uuid) to anon, authenticated;
grant execute on function public.get_creneaux_pris(uuid, date, uuid) to anon, authenticated;
grant execute on function public.reserver_siege(uuid,uuid,text,int,numeric,text,text,timestamptz,text,uuid) to anon, authenticated;

-- ============================================================================
--  SALON DÉMO  (pour que /client/salon.html?s=demo marche tout de suite)
-- ============================================================================
insert into public.salons (nom, slug, wilaya, adresse, formule, mode_reservation, nb_sieges, actif)
values ('Salon Démo Waqqti', 'demo', 'Alger', 'Rue Didouche Mourad, Alger Centre',
        'premium', 'creneau', 3, true)
on conflict (slug) do nothing;

insert into public.prestations (salon_id, nom, categorie, ordre, prix, duree_minutes)
select id, v.nom, v.cat, v.ordre, v.prix, v.duree
from public.salons s,
  (values
    ('Coupe homme',        'Coiffure', 1, 800,  30),
    ('Coupe + barbe',      'Coiffure', 2, 1200, 45),
    ('Coloration',         'Coiffure', 3, 3500, 90),
    ('Brushing',           'Coiffure', 4, 1500, 40),
    ('Manucure',           'Onglerie', 5, 1800, 45),
    ('Soin du visage',     'Soins',    6, 2500, 60)
  ) as v(nom, cat, ordre, prix, duree)
where s.slug = 'demo'
on conflict do nothing;

insert into public.employes (salon_id, nom, ordre)
select id, v.nom, v.ordre
from public.salons s,
  (values ('Yasmine', 1), ('Samira', 2), ('Nadia', 3)) as v(nom, ordre)
where s.slug = 'demo'
on conflict do nothing;

-- ============================================================================
--  FIN — schema.sql
-- ============================================================================
