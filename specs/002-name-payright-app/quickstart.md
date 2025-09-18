# Quickstart: PayRight App Core (developer setup)

This quickstart covers local development for the Expo frontend, Supabase backend (local), and scraper (dry-run). These are minimal steps to get a working development loop.

Prerequisites:
- Node.js 18+ and npm/yarn
- pnpm (optional)
- Docker & Docker Compose (for local Supabase)
- Expo CLI (`npm install -g expo-cli`) or use `npx expo`

1) Start local Supabase (Docker)

Use Supabase local Docker image (example):

```powershell
# from repo root
docker compose -f infra/supabase/docker-compose.yml up -d
```

2) Apply DB schema / migrations

Use supabase CLI or psql to apply the DDL from `data-model.md`.

3) Run the scraper in dry-run mode

The scraper project lives in `/scraper` and can be executed in dry-run to fetch and parse one supermarket as a test. Example:

```powershell
cd scraper
python -m scraper.main --dry-run --target=supermarket-example
```

4) Run Expo frontend

```powershell
cd frontend/payright-app
npm install
npx expo start
```

5) Environment variables

- Create `.env` files for frontend and scraper with Supabase URL and keys (use local supabase instance keys). Avoid committing `.env` to git.

6) Testing the flow

- Run scraper dry-run to insert sample products/prices into local Supabase
- Open Expo app and search for a product inserted by the scraper
- Submit a price report and confirm it appears in `price_reports` table

Troubleshooting:
- If Supabase containers fail, check logs: `docker compose -f infra/supabase/docker-compose.yml logs`
- If scraper fails to parse, inspect the output HTML and adjust selectors or Playwright usage.
