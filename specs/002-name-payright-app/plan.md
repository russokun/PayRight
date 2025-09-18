# Implementation Plan: PayRight App Core

**Branch**: `002-name-payright-app` | **Date**: 2025-09-16 | **Spec**: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\spec.md`
**Input**: Feature specification from `F:\work\cooproyects\PayRight\specs\002-name-payright-app\spec.md`

## Summary
PayRight MVP: mobile-first price comparison app using a Supabase backend and a dedicated scraping microservice to populate a canonical product database and online prices. The app prioritizes fast search, accurate price aggregation (online vs in-store), and community-sourced in-store price reports validated by confirmations. This plan produces research, data-model, API contracts and a quickstart to enable implementation.

## Technical Context
- Language/Version:
  - Frontend: TypeScript (React Native + Expo, latest stable SDK)
  - Scraper: Python 3.11 or Node 18+ (recommend Python for scraping libraries)
- Primary Dependencies:
  - Frontend: Expo Router, NativeWind, Zustand, TanStack Query, Supabase JS SDK
  - Backend: Supabase (Postgres + PostGIS, Auth, Storage, Realtime)
  - Scraper: Playwright (recommended) + BeautifulSoup/Cheerio for parse
- Storage: PostgreSQL (via Supabase) with PostGIS extension for geospatial queries
- Testing: Jest + React Native Testing Library (frontend), pytest or node test framework for scraper, contract tests generated from OpenAPI
- Target Platform: iOS & Android (Expo), Linux servers for scraper and backend services
- Project Type: Mobile + API
- Performance Goals (initial): P95 API latency < 300ms for read queries; scraper refresh cadence: 2–6x per day per supermarket (to be tuned)
- Constraints: Must respect robots.txt and legal constraints; limit scraping load to avoid harming source sites; minimize PII collection

## Constitution Check
- The repository constitution file contains placeholders; no explicit constraints were found. Default project governance applies: test-first principles, security and observability to be enforced during implementation. No blocking contradictions detected at plan time.

## Project Structure (recommended)

Use a multi-package layout that separates mobile app from scraping tooling and infra as follows:

repo/
- frontend/payright-app/  # Expo app (TypeScript)
- scraper/                # Scraper microservice (Python or Node)
- infra/                  # IaC, supabase migrations, cron jobs
- specs/002-name-payright-app/  # This plan and artifacts

## Phase 0: Outline & Research (generated)
See `research.md` (created).

## Phase 1: Design & Contracts (generated)
See `data-model.md`, `contracts/openapi.yaml`, and `quickstart.md` (created).

## Phase 2: Task Planning Approach
Phase 2 (tasks generation) is executed by the `/tasks` command and will produce an ordered tasks.md based on the outputs above. Strategy:
- TDD-first: generate contract tests from OpenAPI and implement to make them pass
- Priority: scraper + data model + auth flows → reporting flows → search UI → gamification
- Parallelizable items: frontend screens, scraper adapters for individual supermarkets

## Complexity Tracking
- No constitution violations found that require exceptions. If product/legal requires extended data retention or additional auditing features, update complexity tracking here.

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (remaining items documented in research)
- [ ] Complexity deviations documented

---

## Generated artifacts (absolute paths)
- Feature spec: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\spec.md`
- Plan (this file): `F:\work\cooproyects\PayRight\specs\002-name-payright-app\plan.md`
- Research: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\research.md`
- Data model: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\data-model.md`
- Quickstart: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\quickstart.md`
- Contracts: `F:\work\cooproyects\PayRight\specs\002-name-payright-app\contracts\openapi.yaml`

---

Ready for the `/tasks` command to generate actionable tasks from the design artifacts.
