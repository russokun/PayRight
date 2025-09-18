(La especificación se escribió el mismo día en que se creó la rama.)

# Feature Specification: PayRight App

**Feature Branch**: `001-name-payright-app`  
**Created**: 2025-09-16  
**Status**: Draft  
**Input**: User description: "Nombre tentativo: PayRight App\nTipo de proyecto: Aplicación móvil colaborativa de comparación de precios de supermercados.\n\nProblema:\n\nPrecios varían significativamente entre cadenas, comunas y sucursales en Chile.\n\nNo existe una app que permita comparar precios rápida y fácilmente.\n\nInflación y alza del costo de vida presionan a las familias a optimizar el gasto.\n\nSolución:\nUna app gratuita y colaborativa que permite:\n\nBuscar productos y comparar precios entre supermercados (ordenados del más barato al más caro).\n\nSubir precios observados (con foto obligatoria en la versión futura).\n\nVer precios cercanos mediante geolocalización.\n\nValidación comunitaria (confirmar o reportar precios incorrectos).\n\nSistema de puntos y ranking para motivar aportes.\n\nHistorial de productos favoritos y alertas de baja de precio.\n\nCarrito inteligente para calcular dónde conviene más comprar (futuro).\n\nPropuesta de valor:\nPlataforma confiable y gratuita que empodera a los consumidores mediante inteligencia colectiva y transparencia de precios.\n\nModelo de negocio (largo plazo):\n\nPublicidad segmentada (ads, productos patrocinados).\n\nAfiliación a e-commerce (Cornershop, Rappi, supermercados online).\n\nPlanes premium (historial avanzado, alertas, sin anuncios).\n\nVenta de datos agregados de consumo.\n\nPatrocinios y colaboraciones con marcas."

## Execution Flow (main)
```
1. Parse user description from Input
	→ If empty: ERROR "No feature description provided"
2. Extract key concepts from description
	→ Identify: actors, actions, data, constraints
3. For each unclear aspect:
	→ Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
	→ If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
	→ Each requirement must be testable
	→ Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
	→ If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
	→ If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## User Scenarios & Testing

### Primary User Story
Como usuario/a preocupado por el presupuesto familiar quiero buscar un producto (p. ej. arroz, leche, detergente) y ver una lista comparativa de precios entre supermercados cercanos y a nivel nacional, para decidir dónde comprar y ahorrar dinero.

### Acceptance Scenarios
1. Given un usuario buscando un producto, When busca por nombre o escanea un código de barras, Then recibe una lista ordenada por precio (más barato → más caro) con la tienda, precio observado, fecha y distancia aproximada.
2. Given un usuario observa un precio en una tienda, When sube el precio (con foto en versiones futuras), Then el precio queda disponible para otros usuarios y recibe puntos según la reputación del aportante.

### Edge Cases
- ¿Qué ocurre si varios precios idénticos provienen de la misma sucursal a la misma hora? -> El sistema debe agrupar observaciones y mostrar rango/mediana.
- ¿Qué pasa si un usuario reporta un precio incorrecto y no hay suficiente confirmación? -> Mostrar marca "reportado" y excluir temporalmente del ranking hasta verificación.
- Manejo de productos sin coincidencias exactas (nombres variantes, presentaciones): usar normalización y mostrar productos similares con etiqueta "posible match".

## Requirements

### Functional Requirements
- **FR-001**: El sistema DEBE permitir a los usuarios buscar productos por nombre y (futuro) escanear código de barras.
- **FR-002**: El sistema DEBE mostrar una lista de precios por producto, ordenada del más barato al más caro, incluyendo: supermercado, sucursal (si está disponible), precio, fecha de observación y distancia al usuario si la geolocalización está activada.
- **FR-003**: Los usuarios DEBEN poder subir observaciones de precios con campos mínimos: producto, precio, supermercado, sucursal (opcional), fecha/hora, y (en el futuro) foto.
- **FR-004**: El sistema DEBE permitir a la comunidad confirmar o reportar observaciones. Observaciones con suficientes confirmaciones se marcan como "verificado"; observaciones reportadas se marcan "en revisión".
- **FR-005**: El sistema DEBE implementar un sistema de reputación y puntos para incentivar aportes (puntos por aportes verificados, penalización por aportes reportados).
- **FR-006**: El sistema DEBE permitir ver precios cercanos usando geolocalización del usuario, respetando la privacidad y solicitando consentimiento explícito.
- **FR-007**: El sistema DEBE permitir marcar productos como favoritos y crear alertas cuando el precio baja por debajo de un umbral definido por el usuario.
- **FR-008**: El sistema DEBE proporcionar vistas agregadas (historial de precios por producto) para usuarios premium (futuro) y/o para cálculos de "carrito inteligente".
- **FR-009**: El sistema DEBE permitir exportar o compartir una lista comparativa (por ejemplo, para enviar a otras personas).
- **FR-010**: El sistema DEBE registrar metadatos mínimos para cada observación para auditoría y análisis (sin incluir datos personales innecesarios).

*Observaciones y [NEEDS CLARIFICATION] marcados abajo para decisiones que requieren definición explícita.*

### Key Entities
- **Product**: representa un artículo (nombre, variantes/presentaciones, código de barras opcional, unidad de medida, categoría).
- **Observation / PriceEntry**: precio observado (producto referencia, precio, currency, tienda, sucursal, geolocation opcional, timestamp, user_id anónimo opcional, verification_status, photo metadata futuro).
- **Store (Supermarket)**: cadena, sucursal, dirección, geo-coordinates.
- **User**: identidad mínima (puede ser anónima o con cuenta), reputación/puntos, roles (normal, moderator) [NEEDS CLARIFICATION: definir niveles y permisos].
- **Alert**: configuración de usuario para notificar bajas de precio (producto, umbral, periodicidad, canales: in-app, email) [NEEDS CLARIFICATION: canales soportados y frecuencia].

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

## Ambiguities & Questions [NEEDS CLARIFICATION]

1. ¿Qué niveles de usuario y permisos son necesarios? (p. ej. anónimo, registrado, moderador, admin). Recomendación: permitir aportes anónimos con opción de crear cuenta para reputación y moderación.
2. ¿Qué datos personales se guardarán y por cuánto tiempo? (retención, borrado, cumplimiento LOPD/Chile). Necesario para privacidad y decisiones de diseño.
3. ¿Se exige foto obligatoria desde lanzamiento o se postergará para una versión futura? El prompt sugiere foto obligatoria en versión futura — aquí la dejamos como futuro.
4. ¿Qué criterios cuantitativos definen "suficientes confirmaciones" para marcar una observación como verificada? (recomendación: 2 confirmaciones de usuarios distintos o 1 confirmación de usuario con reputación alta).
5. ¿Qué granularidad de producto se requiere (presentaciones, marcas, tamaños)? Definir cómo normalizar nombres y cuando confluyen variantes.
6. ¿Política frente a observaciones maliciosas o spam y proceso de apelación para usuarios sancionados?
7. ¿Canales de notificación soportados para alertas (in-app, push, email, SMS) y frecuencia mínima?

## Non-functional considerations (informative, not prescriptive)

- Privacidad: solicitar consentimiento para geolocalización, minimizar PII, encriptar datos sensibles en tránsito y en reposo.
- Escalabilidad: diseñar para gran número de observaciones y consultas geoespaciales; usar paginación y límites por consulta.
- UX: optimizar búsqueda por texto y código de barras; mostrar confianza/recencia de cada observación.

## Next steps
1. Resolver las preguntas en "Ambiguities & Questions" con el equipo de producto / legal.
2. Priorizar el MVP (por ejemplo: búsqueda, subida de observaciones sin foto, geolocalización básica, confirmaciones).  
3. Definir métricas de éxito (número de observaciones por semana, % verificadas, usuarios activos diarios, retención).  
4. Preparar wireframes y flujos de onboarding para la versión móvil.

---

**Escrito por:** Spec generator (automático) — revisar y validar.

