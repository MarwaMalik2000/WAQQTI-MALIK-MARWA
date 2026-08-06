-- ============================================================================
--  WAQQTI — migration_v2.sql
--  1) Plafond de réservations / jour (mode journée)
--  2) Confidentialité : plus de lecture publique des réservations (nom+tél)
--  3) « Mes réservations » : lien réservation ↔ compte client
--  À coller dans Supabase → SQL Editor → Run. Rejouable.
-- ============================================================================

-- ── Colonnes ─────────────────────────────────────────────────────────────
alter table public.salons        add column if not exists capacite_jour   int;      -- plafond/jour (mode journée). NULL = illimité
alter table public.reservations  add column if not exists client_user_id  uuid references auth.users(id) on delete set null;
create index if not exists idx_resa_client_user on public.reservations(client_user_id);

-- ── 1+3. Réservation : plafond journée + rattachement au compte client ───────
drop function if exists public.creer_reservation(uuid,uuid,text,int,numeric,text,text,timestamptz,text,uuid);
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
  p_employe_id    uuid default null,
  p_user_id       uuid default null
) returns public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_salon    public.salons;
  v_prest    public.prestations;
  v_capacite int;
  v_exc      int;
  v_occupes  int;
  v_montant  numeric(10,2) := null;
  v_statut   acompte_statut_t := 'non_requis';
  v_deadline timestamptz := null;
  v_row      public.reservations;
begin
  select * into v_salon from public.salons where id = p_salon_id;
  if not found then raise exception 'Salon introuvable'; end if;

  if not public.verifier_acces_salon(p_salon_id) then
    raise exception 'Salon indisponible (essai expiré ou compte désactivé)' using errcode = 'P0001';
  end if;

  -- Exception de fermeture éventuelle
  select capacite into v_exc from public.siege_exceptions
    where salon_id = p_salon_id and jour = (p_date_rdv at time zone 'UTC')::date;
  if v_exc is not null and v_exc = 0 then raise exception 'Salon fermé ce jour'; end if;

  if v_salon.mode_reservation = 'journee' then
    -- Mode journée : illimité, sauf plafond capacite_jour si défini
    if v_salon.capacite_jour is not null and v_salon.capacite_jour > 0 then
      select count(*) into v_occupes from public.reservations
        where salon_id = p_salon_id and statut <> 'annule'
          and date_rdv::date = p_date_rdv::date;
      if v_occupes >= v_salon.capacite_jour then
        raise exception 'Complet : nombre maximum de réservations atteint pour ce jour' using errcode = 'P0002';
      end if;
    end if;
  else
    -- Mode créneau : capacité par sièges + anti-chevauchement
    v_capacite := coalesce(v_exc, v_salon.nb_sieges, 1);
    if v_capacite <= 0 then raise exception 'Salon fermé ce jour'; end if;
    select count(*) into v_occupes from public.reservations
      where salon_id = p_salon_id and statut <> 'annule'
        and tstzrange(date_rdv, date_rdv + make_interval(mins => duree_minutes))
         && tstzrange(p_date_rdv, p_date_rdv + make_interval(mins => p_duree));
    if v_occupes >= v_capacite then
      raise exception 'Complet : plus de siège disponible sur ce créneau' using errcode = 'P0002';
    end if;
  end if;

  -- Acompte
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
      acompte_statut, acompte_montant, acompte_deadline, client_user_id)
  values (
      p_salon_id, p_employe_id, p_prestation_id, p_prestation_nom, p_duree, p_prix,
      p_client_nom, p_client_tel, p_date_rdv, p_notes, 'confirme', 'public',
      v_statut, v_montant, v_deadline, p_user_id)
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.creer_reservation(uuid,uuid,text,int,numeric,text,text,timestamptz,text,uuid,uuid)
  to anon, authenticated;

-- ── 2. Confidentialité : lecture du statut sans exposer nom/téléphone ────────
create or replace function public.statut_reservation(p_id uuid)
returns table (
  id uuid, salon_id uuid, prestation_nom text, prix numeric, duree_minutes int,
  date_rdv timestamptz, acompte_montant numeric, acompte_statut acompte_statut_t,
  justificatif_url text, statut statut_resa_t
)
language sql stable security definer set search_path = public as $$
  select r.id, r.salon_id, r.prestation_nom, r.prix, r.duree_minutes,
         r.date_rdv, r.acompte_montant, r.acompte_statut, r.justificatif_url, r.statut
  from public.reservations r where r.id = p_id;
$$;
grant execute on function public.statut_reservation(uuid) to anon, authenticated;

-- ── 3. Le client connecté lit SES propres réservations ───────────────────────
drop policy if exists "resa client own" on public.reservations;
create policy "resa client own" on public.reservations
  for select to authenticated
  using (client_user_id = auth.uid());

-- ── 2. Retirer la lecture publique large des réservations ────────────────────
--  (les dispos passent désormais par get_creneaux_pris, le suivi par
--   statut_reservation — aucune donnée client n'est exposée à anon.)
drop policy if exists "resa read public creneaux" on public.reservations;

-- ============================================================================
--  FIN — migration_v2.sql
-- ============================================================================
