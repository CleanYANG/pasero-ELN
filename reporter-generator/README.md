# Reporter Generator (Pasero public beta)

A standalone web tool that turns research material into **editable** academic posters and talk slides.
It is deliberately separate from the main site (`build-site.mjs` does not copy this folder into `dist/`).

```
reporter-generator/            static site (no build step) → Vercel project, Root Directory = reporter-generator
  index.html  styles.css  config.js  privacy.html  vercel.json  assets/
  js/parse.js    local parsing: PDF, Word, Excel/CSV, PPTX, images, pasted text (in the browser)
  js/layout.js   one layout engine for preview, PPTX export and print PDF; templates + palettes
  js/app.js      UI, chat edits, number check, source tracing, auth, calls to the edge function
  js/demo.js     offline sample (fictional paper), no AI call
  js/i18n.js     UI strings: 中文 / English
supabase/functions/reporter/index.ts        edge function: text model + image model, quota, guard rails
supabase/migrations/202610300001_reporter_usage.sql   usage counters (no research content)
```

## What runs where

| Step | Where | Notes |
|---|---|---|
| Parse files, keep original figures | Browser | Originals never uploaded |
| Organise content, lay out, chat edits | Edge function → text model | Only the JSON shown under “What the AI will receive” |
| Schematic images | Edge function → image model | Only the schematic's text description; result-figure requests are refused in code |
| Layout, PPTX/PDF export | Browser | Same element list for preview and export |

Model and provider names are never sent to the browser. Change models with secrets, not code.

## Scientific guard rails

- Prompt layer (`SCIENCE_RULES` in the function): material-only, no stronger claims, exact numbers, figures by id, source ids per slide/section.
- Code layer: figure/schematic/source ids are filtered against what was sent (`cleanReport` in `app.js`); result-figure keywords are refused before any image call (`RESULT_FIGURE_RE`); every AI image gets a non-removable “AI-generated schematic” label in preview, PPTX and PDF; numbers not found in the sent material are highlighted yellow.

## Deploy

### 1. Supabase (project `gnfxemlrgjwcqxqruzev`)
```bash
supabase link --project-ref gnfxemlrgjwcqxqruzev
supabase db push                       # applies 202610300001_reporter_usage.sql
supabase secrets set ANTHROPIC_API_KEY=... OPENAI_API_KEY=... \
  REPORTER_ALLOWED_ORIGINS=https://reporter.pasero.app,http://localhost:5173
supabase functions deploy reporter
```
Optional secrets (defaults in brackets): `REPORTER_TEXT_MODEL` [claude-sonnet-5-5], `REPORTER_IMAGE_MODEL` [gpt-image-2],
`REPORTER_IMAGE_QUALITY` [medium], `REPORTER_LIMIT_PLAN` [5], `REPORTER_LIMIT_REVISE` [40], `REPORTER_LIMIT_IMAGE` [10].
The free allowance follows the existing `public_beta_2026` window (`pasero_get_my_beta_access`).

Auth → URL Configuration: add `https://reporter.pasero.app` to **Redirect URLs** (email magic link).

### 2. Client config
Put the project's **publishable (anon) key** in `reporter-generator/config.js`. Never put the service-role key or AI keys there.

### 3. Vercel
New project from this repo → **Root Directory: `reporter-generator`**, Framework: Other, no build command.
Domains → add `reporter.pasero.app`, then add the CNAME record Vercel shows at your DNS provider.

### 4. Provider dashboards
Set monthly spend limits for both API accounts before opening the beta.

## Local preview
```bash
cd reporter-generator && python3 -m http.server 5173
```
The sample paper works without any keys.
