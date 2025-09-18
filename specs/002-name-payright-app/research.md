# Phase 0 Research: PayRight App Core

## Objetivo
Resolver las incógnitas del spec y documentar decisiones tomadas para permitir el diseño (Phase 1). Esta investigación se basa en la especificación del feature y las decisiones de arquitectura propuestas (scraper como fuente maestra, Supabase como backend, Expo/React Native frontend).

## Resolved Unknowns (decisiones tomadas)

1. **Normalización de Productos**
- Decision: El scraper genera la base maestra de productos; usuarios no crean productos en MVP.
- Rationale: datos más limpios y búsqueda más fiable desde el inicio.
- Action: Priorizar el scraper y diseñar el mapeo de SKUs entre supermercados.

2. **Criterio de Verificación**
- Decision: Distinguir "Precio Online" (scraper, verificado) vs "Precio en Tienda" (usuario). 2 confirmaciones => "Oferta Verificada en Tienda"; 2 reportes "incorrecto" => "en revisión".
- Rationale: evita sobrecargar la validación comunitaria y centra su valor en detectar ofertas físicas.
- Action: Definir límites temporales para confirmaciones (ej: confirmaciones válidas dentro de 48h del reporte) y anti-abuse.

3. **Gestión de Sucursales**
- Decision: Scraper captura sucursal cuando la web lo permite; la app sugiere sucursal por geolocalización en reportes.
- Rationale: aumenta granularidad y UX.
- Action: Diseñar API de concordancia ubicación->sucursal y fallback si geolocalización no disponible.

4. **Política de Puntos (propuesta)**
- Decision: Puntos dirigidos a aportes que complementan el scraper (ofertas en tienda). Propuesta: +25 / +5 / +1 / -10.
- Rationale: incentiva aportes de alto valor.
- Action: Revisar anti-fraud y límites diarios; definir métricas de éxito para ajustes.

## Remaining Open Questions (require product/legal decisions)

- **Retención de datos y PII**: ¿Cuánto tiempo se conservan las observaciones y qué PII se guarda? (Recomendación: anonimizar userID por defecto, retener observaciones 2 años, logs 90 días — validar con legal.)
- **Niveles de usuario y permisos**: Definir roles: anónimo, registrado, moderador, admin; establecer procesos de apelación y sanciones.
- **Canales de notificación MVP**: Decidir si MVP soporta solo push/in-app o también email/SMS.

## Risks & Mitigations

- Scraper legal/compliance risk: revisar términos de uso y robots.txt; prefer APIs si existen; limitar request rate.
- Data drift between online and in-store prices: track timestamps and show recency/confidence in UI.
- Abuse of points system: implement rate limits, heuristics for suspicious behavior, and manual moderation flow.

## Next actions (Phase 1 prerequisites)

1. Write DB schema for products, prices, price_reports, users, points ledger (see `data-model.md`).
2. Define OpenAPI endpoints for search, report submission, confirmations, auth (see `contracts/openapi.yaml`).
3. Create quickstart with local dev instructions: run supabase locally, run frontend with Expo, run scraper in dry-run mode (see `quickstart.md`).
