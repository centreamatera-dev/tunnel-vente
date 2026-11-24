-- Tunnel de vente Centre Amatera : table des contacts
-- À coller dans Supabase > SQL Editor > Run. Relançable sans risque.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Étape 1 : page de capture
  first_name text not null check (char_length(first_name) between 1 and 80),
  phone text not null check (phone ~ '^\+33[67][0-9]{8}$'),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_at timestamptz not null,
  consent_text text not null,

  -- Suivi dans le tunnel
  stage text not null default 'capture'
    check (stage in ('capture', 'qualifie', 'rdv_pris', 'present', 'signe', 'perdu')),

  -- Étape 3 : questions de qualification
  priority text check (priority in ('laser', 'visage', 'les-deux')),
  zone text check (char_length(zone) <= 200),
  contraindication text check (contraindication in ('non', 'oui', 'ne-sais-pas')),
  experience text check (experience in ('jamais', 'laser', 'soin-visage', 'les-deux')),
  source text check (source in ('google', 'instagram', 'bouche-a-oreille', 'flyer', 'autre')),
  qualified_at timestamptz,

  -- Origine du trafic
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,

  -- À remplir à la main (ex : contre-indication à revoir avant le rendez-vous)
  notes text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_stage_idx on public.leads (stage);

-- Sécurité : aucune policy, donc seule la clé service_role
-- (utilisée côté serveur, dans les fonctions Vercel) peut lire ou écrire.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

-- Suivi hebdomadaire : contacts, qualifiés, rendez-vous pris, présentes, signées.
-- Les étapes rdv_pris, present et signe se mettent à jour à la main dans Supabase.
create or replace view public.leads_par_semaine
with (security_invoker = true) as
select
  date_trunc('week', created_at) as semaine,
  count(*) as contacts,
  count(*) filter (where stage <> 'capture') as qualifies,
  count(*) filter (where stage in ('rdv_pris', 'present', 'signe')) as rdv_pris,
  count(*) filter (where stage in ('present', 'signe')) as presentes,
  count(*) filter (where stage = 'signe') as signees
from public.leads
group by 1
order by 1 desc;

revoke all on public.leads_par_semaine from anon, authenticated;
