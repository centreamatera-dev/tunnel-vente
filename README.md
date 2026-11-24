# Tunnel du bilan peau gratuit (Centre Amatera)

Pages construites : page 1 (capture), page 3 (réservation), et une page 2 provisoire (`/video`) pour tester le parcours.

## Parcours

`/` (3 champs) → `/video` (provisoire) → `/reservation` (5 questions) → bouton vers l'agenda Planity.

## Mise en ligne

1. **Supabase** : créer un projet, ouvrir *SQL Editor*, coller le contenu de `schema.sql`, cliquer *Run*.
2. **Vercel** : importer ce dossier (via GitHub ou `vercel --prod`).
3. Dans Vercel > *Settings* > *Environment Variables*, ajouter :
   - `SUPABASE_URL` (Supabase > *Project Settings* > *API*)
   - `SUPABASE_SERVICE_ROLE_KEY` (même écran, clé `service_role`, secrète)
4. Dans `public/js/config.js`, remplacer `planityUrl` par le lien du service « Bilan peau gratuit 30 min ».
5. Redéployer, puis passer une fois dans tout le parcours depuis un téléphone. Le contact doit apparaître dans la table `leads` avec ses 5 réponses.

## À faire avant les pubs

- Créer la page `/mentions-legales` (le lien existe en bas de la page 1).
- Remplacer `public/video.html` par la vraie page vidéo (étape 2).

## Suivi

- Table `leads` : une ligne par contact, colonne `stage` (`capture`, `qualifie`, `rdv_pris`, `present`, `signe`, `perdu`).
- `capture` et `qualifie` se remplissent seuls. Les étapes suivantes se mettent à jour à la main dans Supabase.
- Vue `leads_par_semaine` : contacts, qualifiés, rendez-vous pris, présentes, signées.

## Sécurité

- La clé `service_role` n'est lue que par les fonctions `api/`, jamais par les pages.
- La table n'a aucune règle d'accès public : personne ne peut la lire depuis un navigateur.
