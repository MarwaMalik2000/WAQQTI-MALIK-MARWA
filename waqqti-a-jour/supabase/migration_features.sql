-- ============================================================================
--  WAQQTI — migration_features.sql
--  Ajouts NON destructifs à coller dans le SQL Editor APRÈS schema.sql.
--  Sûr à ré-exécuter (idempotent : add column if not exists / create or replace).
--
--  Contenu :
--    1. RIB / coordonnées de paiement du salon (CCP, BaridiMob, RIB)
--    2. Configuration de l'acompte par prestation (pourcentage ou montant fixe)
--    3. Géolocalisation des salons (latitude / longitude) + annuaire
--    4. Table profiles (Nom / Prénom liés à auth.users) + trigger d'inscription
--    5. RPC de réservation avec calcul automatique de l'acompte
--    6. RPC d'attachement du justificatif (upload client) + policies Storage
--    7. RPC annuaire + recherche par proximité (Haversine)
--    8. RPC admin : lier un salon à un compte gérant
-- ============================================================================

-- ── 1. RIB / COORDONNÉES DE PAIEMENT DU SALON ────────────────────────────────
alter table public.salons add column if not exists rib_titulaire   text;
alter table public.salons add column if not exists rib_type        text
      check (rib_type in ('ccp','baridimob','rib','autre'));
alter table public.salons add column if not exists rib_numero      text;   -- N° CCP / RIB / tél BaridiMob
alter table public.salons add column if not exists rib_cle         text;   -- clé CCP (2 chiffres) si applicable
alter table public.salons add column if not exists rib_instructions text;  -- consigne libre affichée au client

-- ── 3. GÉOLOCALISATION ───────────────────────────────────────────────────────
alter table public.salons add column if not exists latitude  double precision;
alter table public.salons add column if not exists longitude double precision;
create index if not exists idx_salons_geo on public.salons(latitude, longitude);

-- ── 2. CONFIG ACOMPTE PAR PRESTATION ─────────────────────────────────────────
alter table public.prestations add column if not exists acompte_actif  boolean not null default false;
alter table public.prestations add column if not exists acompte_type   text not null default 'pourcentage'
      check (acompte_type in ('pourcentage','fixe'));
alter table public.prestations add column if not exists acompte_valeur numeric(10,2) not null default 0;
--   pourcentage → acompte_valeur = 20  (= 20 %)
--   fixe        → acompte_valeur = 500 (= 500 DA)

-- ── 4. PROFILES (Nom / Prénom liés à auth.users) ─────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nom        text,
  prenom     text,
  email      text,
  telephone  text,
  role       text not null default 'client' check (role in ('client','gerant','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chacun lit / modifie SON propre profil
drop policy if exists "profiles self read"  on public.profiles;
create policy "profiles self read"  on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self write" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- Création automatique du profil à chaque inscription (email OU Google OAuth).
-- Récupère nom/prénom depuis les métadonnées envoyées au signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom, prenom, email, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom',    new.raw_user_meta_data->>'family_name'),
    coalesce(new.raw_user_meta_data->>'prenom', new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'full_name'),
    new.email,
    new.raw_user_meta_data->>'telephone'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 5. RÉSERVATION AVEC CALCUL AUTOMATIQUE DE L'ACOMPTE ───────────────────────
-- Remplace l'insert direct de salon.html. Vérifie le Kill Switch + la capacité,
-- calcule l'acompte depuis la config de la prestation, fixe l'échéance, insère.
-- Renvoie la ligne complète (id, acompte_montant, acompte_statut, acompte_deadline).
create or replace function public.creer_reservation(
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
  v_prest    public.prestations;
  v_capacite int;
  v_occupes  int;
  v_montant  numeric(10,2) := null;
  v_statut   acompte_statut_t := 'non_requis';
  v_deadline timestamptz := null;
  v_row      public.reservations;
begin
  select * into v_salon from public.salons where id = p_salon_id;
  if not found then raise exception 'Salon introuvable'; end if;

  if not public.verifier_acces_salon(p_salon_id) then
    raise exception 'Salon indisponible (essai expiré ou compte désactivé)'
      using errcode = 'P0001';
  end if;

  -- Capacité du jour (exception éventuelle sinon nb_sieges)
  select coalesce(
      (select capacite from public.siege_exceptions
        where salon_id = p_salon_id and jour = (p_date_rdv at time zone 'UTC')::date),
      v_salon.nb_sieges, 1)
    into v_capacite;
  if v_capacite <= 0 then raise exception 'Salon fermé ce jour'; end if;

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

  -- Calcul de l'acompte depuis la config de la prestation
  if p_prestation_id is not null then
    select * into v_prest from public.prestations where id = p_prestation_id;
    if found and v_prest.acompte_actif then
      if v_prest.acompte_type = 'pourcentage' then
        v_montant := round(coalesce(p_prix, v_prest.prix) * v_prest.acompte_valeur / 100.0);
      else
        v_montant := v_prest.acompte_valeur;
      end if;
      if v_montant is not null and v_montant > 0 then
        v_statut   := 'en_attente';
        v_deadline := public.acompte_deadline(p_date_rdv);
      end if;
    end if;
  end if;

  insert into public.reservations(
      salon_id, employe_id, prestation_id, prestation_nom, duree_minutes, prix,
      client_nom, client_telephone, date_rdv, notes, statut, source,
      acompte_statut, acompte_montant, acompte_deadline)
  values (
      p_salon_id, p_employe_id, p_prestation_id, p_prestation_nom, p_duree, p_prix,
      p_client_nom, p_client_tel, p_date_rdv, p_notes, 'confirme', 'public',
      v_statut, v_montant, v_deadline)
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.creer_reservation(uuid,uuid,text,int,numeric,text,text,timestamptz,text,uuid)
  to anon, authenticated;

-- ── 6. ATTACHER LE JUSTIFICATIF (upload côté client anonyme) ──────────────────
-- Le client (anon) vient d'uploader une image dans le bucket 'justificatifs'.
-- Cette RPC relie l'URL/chemin à la réservation et remet l'acompte "en attente
-- de vérification". On n'autorise que si l'acompte est bien attendu.
create or replace function public.attacher_justificatif(
  p_reservation_id uuid,
  p_chemin         text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.reservations
     set justificatif_url = p_chemin,
         acompte_statut   = 'en_attente'
   where id = p_reservation_id
     and acompte_statut in ('en_attente','refuse');
  if not found then
    raise exception 'Réservation introuvable ou acompte non requis';
  end if;
end $$;

grant execute on function public.attacher_justificatif(uuid,text) to anon, authenticated;

-- Validation / refus par le gérant (met à jour le statut d'acompte).
create or replace function public.statuer_acompte(
  p_reservation_id uuid,
  p_decision       text            -- 'recu' ou 'refuse'
) returns void
language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if p_decision not in ('recu','refuse') then
    raise exception 'Décision invalide';
  end if;
  select s.owner into v_owner
    from public.reservations r join public.salons s on s.id = r.salon_id
   where r.id = p_reservation_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Non autorisé';
  end if;
  update public.reservations
     set acompte_statut = p_decision::acompte_statut_t
   where id = p_reservation_id;
end $$;

grant execute on function public.statuer_acompte(uuid,text) to authenticated;

-- ── Storage : autoriser l'upload anonyme dans 'justificatifs' ────────────────
-- Le client n'est pas connecté : il doit pouvoir DÉPOSER (insert) un fichier.
-- La LECTURE reste réservée au gérant (policy "justif owner all" de schema.sql),
-- qui génère une URL signée pour afficher l'image dans son dashboard.
drop policy if exists "justif anon upload" on storage.objects;
create policy "justif anon upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'justificatifs');

-- ── 7. ANNUAIRE PUBLIC + RECHERCHE DE PROXIMITÉ ──────────────────────────────
-- Liste les salons visibles (actifs + Kill Switch OK) avec un filtre texte.
create or replace function public.annuaire_salons(p_search text default null)
returns table (
  id uuid, nom text, slug text, wilaya text, adresse text,
  formule formule_t, telephone text,
  latitude double precision, longitude double precision
)
language sql stable security definer set search_path = public as $$
  select s.id, s.nom, s.slug, s.wilaya, s.adresse, s.formule, s.telephone,
         s.latitude, s.longitude
  from public.salons s
  where s.actif = true
    and public.verifier_acces_salon(s.id)
    and (
      p_search is null or p_search = ''
      or s.nom     ilike '%'||p_search||'%'
      or s.wilaya  ilike '%'||p_search||'%'
      or s.adresse ilike '%'||p_search||'%'
    )
  order by s.nom asc;
$$;

grant execute on function public.annuaire_salons(text) to anon, authenticated;

-- Distance (km) entre deux points GPS — formule de Haversine.
create or replace function public.distance_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2-lat1)/2),2) +
    cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lon2-lon1)/2),2)
  ));
$$;

-- Salons triés par proximité d'un point (bouton "📍 Autour de moi").
create or replace function public.salons_proches(
  p_lat double precision, p_lng double precision, p_limit int default 30
)
returns table (
  id uuid, nom text, slug text, wilaya text, adresse text,
  formule formule_t, telephone text,
  latitude double precision, longitude double precision, distance double precision
)
language sql stable security definer set search_path = public as $$
  select s.id, s.nom, s.slug, s.wilaya, s.adresse, s.formule, s.telephone,
         s.latitude, s.longitude,
         public.distance_km(p_lat, p_lng, s.latitude, s.longitude) as distance
  from public.salons s
  where s.actif = true
    and public.verifier_acces_salon(s.id)
    and s.latitude is not null and s.longitude is not null
  order by distance asc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.salons_proches(double precision, double precision, int) to anon, authenticated;

-- ── 8. ADMIN : lier un salon à un compte gérant (par email) ──────────────────
-- Après que le gérant s'est inscrit (auth), tu relies son salon depuis admin.html.
-- Réservé au rôle 'admin' (profiles.role).
create or replace function public.lier_salon_owner(
  p_salon_id uuid, p_email text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_is_admin boolean;
begin
  select (role = 'admin') into v_is_admin from public.profiles where id = auth.uid();
  if coalesce(v_is_admin,false) = false then
    raise exception 'Réservé à l''administrateur';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(p_email);
  if v_uid is null then
    raise exception 'Aucun compte pour cet email (le gérant doit s''inscrire d''abord)';
  end if;
  update public.salons set owner = v_uid where id = p_salon_id;
  update public.profiles set role = 'gerant' where id = v_uid and role <> 'admin';
end $$;

grant execute on function public.lier_salon_owner(uuid,text) to authenticated;

-- ── 9. POLICY ADMIN sur salons (permet à admin.html de fonctionner) ──────────
-- schema.sql n'a AUCUNE policy INSERT/UPDATE globale sur salons : avec la clé
-- anon, admin.html ne peut donc ni créer ni changer la formule d'un salon.
-- On autorise le rôle 'admin' (profiles.role) à tout faire sur salons.
drop policy if exists "salons admin all" on public.salons;
create policy "salons admin all" on public.salons
  for all to authenticated
  using      (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================================
--  FIN — migration_features.sql
--  ⚠️ Pense à te définir comme admin une fois inscrit :
--     update public.profiles set role='admin' where email='TON_EMAIL';
-- ============================================================================
