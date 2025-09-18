# Feature Specification: PayRight App Core

**Feature Branch**: `002-name-payright-app`  
**Created**: 2025-09-16  
**Status**: Refined  
**Input**: Project description for a collaborative price comparison mobile app.

---

## ⚡ Quick Guidelines
- ✅ **Focus on WHAT & WHY**: Describe the value for the user.
- ❌ **Avoid HOW**: No details about technology, databases, or frameworks.
- 👥 **Audience**: Product owners, stakeholders, and developers who need to understand the feature's purpose.

---

## User Scenarios & Testing

### 🎯 Primary User Stories

1.  **Como consumidor/a con un presupuesto ajustado**, quiero buscar un producto y ver rápidamente dónde es más barato comprarlo, para poder ahorrar dinero en mis compras semanales.
2.  **Como colaborador/a activo/a de la comunidad**, quiero subir los precios que veo en el supermercado de forma sencilla y ser reconocido/a por mis aportes, para ayudar a otros a ahorrar y sentir que mi esfuerzo tiene valor.

### ✅ Acceptance Scenarios

1.  **Given** un usuario busca "Leche Colun Entera 1L", **When** la búsqueda se completa, **Then** el sistema muestra una lista de precios ordenada del más bajo al más alto, indicando el supermercado, la sucursal, el precio y la fecha del reporte.
2.  **Given** un colaborador está en un supermercado, **When** abre el formulario para reportar un precio, ingresa el producto, el precio y selecciona el supermercado, **Then** su reporte se sube exitosamente y recibe puntos de contribución en su perfil.
3.  **Given** un usuario ve un precio que ya no es válido, **When** presiona el botón "Reportar incorrecto", **Then** el precio se marca como "en revisión" para que la comunidad o moderadores lo validen.

### ⚠️ Edge Cases

- **Producto no encontrado**: Si la búsqueda no arroja resultados, el sistema debe mostrar un mensaje claro y sugerir búsquedas similares o la opción de "Añadir este producto".
- **Precios duplicados**: Si se suben múltiples precios para el mismo producto en la misma sucursal en un corto periodo, el sistema debe agruparlos, mostrando el más reciente como principal y los otros como confirmaciones.
- **Conectividad**: La app debe manejar la falta de conexión a internet de forma elegante, permitiendo al usuario ver datos cacheados y notificándole cuando una acción (como subir un precio) no se puede completar.

---

## Requirements

### Functional Requirements (MVP Scope)

- **FR-001 (Búsqueda de Productos)**: El sistema DEBE permitir a los usuarios buscar productos por su nombre o marca.
- **FR-002 (Visualización de Precios)**: El sistema DEBE mostrar los resultados de la búsqueda como una lista comparativa, ordenada por defecto del precio más bajo al más alto. Cada item DEBE mostrar: Nombre del producto, precio, nombre del supermercado y fecha/hora del reporte.
- **FR-003 (Reporte de Precios)**: Un usuario (anónimo o registrado) DEBE poder reportar un precio. El formulario DEBE solicitar como mínimo: Producto, Precio y Supermercado.
- **FR-004 (Perfil de Usuario Básico)**: Los usuarios DEBEN poder registrarse. El perfil DEBE mostrar el nombre de usuario, los puntos acumulados y un ranking simple basado en sus contribuciones.
- **FR-005 (Sistema de Puntos)**: El sistema DEBE asignar puntos a los usuarios por cada reporte de precio válido que realicen.
- **FR-006 (Validación Comunitaria Simple)**: Los usuarios DEBEN poder realizar dos acciones sobre un precio reportado: "Confirmar" (si el precio es correcto) o "Reportar" (si es incorrecto).
- **FR-007 (Geolocalización Opcional)**: La app DEBE solicitar permiso para acceder a la ubicación del usuario. Si es otorgado, DEBE mostrar los supermercados cercanos en los resultados de búsqueda.

### Functional Requirements (Post-MVP / Future)

- **FR-008 (Alertas de Precios)**: Los usuarios podrán marcar productos como "Favoritos" y configurar alertas para ser notificados cuando su precio baje.
- **FR-009 (Verificación por Foto)**: El reporte de precios requerirá una foto del producto y/o la boleta para ser considerado "verificado".
- **FR-010 (Carrito Inteligente)**: El sistema podrá calcular en qué combinación de supermercados es más conveniente comprar una lista completa de productos.
- **FR-011 (Escaneo de Código de Barras)**: La búsqueda de productos se podrá realizar escaneando el código de barras.

---

### Key Entities

- **Product**: Representa un artículo de supermercado. Atributos: `productID`, `name`, `brand`, `category`, `barcode` (opcional).
- **PriceReport**: Un registro de precio enviado por un usuario. Atributos: `reportID`, `productID` (referencia), `price`, `supermarketID` (referencia), `userID` (referencia), `timestamp`, `status` (p. ej., "pendiente", "verificado", "reportado").
- **Supermarket**: Una cadena o tienda. Atributos: `supermarketID`, `name`, `branchName` (opcional), `location` (coordenadas).
- **User**: Un participante de la comunidad. Atributos: `userID`, `username`, `points`, `rank`.

---

## Ambiguities & Questions [NEEDS CLARIFICATION]

1.  **Normalización de Productos**: ¿Cómo se manejarán las variaciones de un mismo producto? (p. ej., "Coca-Cola 1.5L" vs. "Bebida Coca-Cola 1.5L Desechable"). ¿Habrá una base de datos maestra o los usuarios crearán los productos? **Recomendación MVP**: Empezar con una lista predefinida de los 500 productos más comunes y permitir a los usuarios sugerir nuevos.
2.  **Criterio de Verificación**: ¿Cuántas confirmaciones se necesitan para que un precio pase a estado "verificado"? ¿Un reporte de "incorrecto" lo oculta inmediatamente? **Recomendación MVP**: 3 confirmaciones lo marcan como verificado. 2 reportes de "incorrecto" lo marcan como "en revisión" y le bajan la visibilidad.
3.  **Gestión de Sucursales**: ¿Los usuarios seleccionarán la cadena (Jumbo, Lider) o la sucursal específica (Jumbo Bilbao, Lider Quilín)? **Recomendación MVP**: Empezar solo con la cadena de supermercado para simplificar el formulario de reporte. La sucursal se puede añadir con geolocalización en una fase posterior.

4.  **Política de Puntos**: ¿Cuál será la fórmula exacta para asignar y quitar puntos? (p. ej., +10 por reporte, +2 por confirmación, -15 si tu reporte es marcado como incorrecto).

---

## Registro de Decisiones de Arquitectura y Producto (MVP)

Contexto: Se ha decidido que la fuente principal de datos de productos y precios para el MVP de PayRight será un sistema de web scraping en tiempo real de los sitios de e-commerce de los principales supermercados. Los aportes de la comunidad servirán como una fuente de datos secundaria para validar y complementar los precios en tiendas físicas, que pueden diferir de los precios online.

Estas decisiones resuelven varias ambigüedades previas y establecen el rumbo técnico y de producto para el MVP.

1) Decisión sobre Normalización de Productos
- Decisión: La base de datos de productos será maestra y generada automáticamente por el scraper. No se permitirá a los usuarios crear nuevos productos en el MVP.
- Justificación: El scraper extraerá el nombre, la marca, el tamaño y el SKU/código de barras directamente de cada supermercado. Esto nos da una base de datos estructurada y limpia desde el día uno, eliminando el problema de las entradas duplicadas o mal escritas por los usuarios.
- Impacto en el MVP:
	- ✅ Se elimina la necesidad de una función de "sugerir producto".
	- ✅ La búsqueda de productos será mucho más precisa.
	- 🎯 Foco de desarrollo: construir un scraper robusto y un sistema de mapeo de productos en el backend (resolver emparejamiento de SKUs entre supermercados).

2) Decisión sobre Criterio de Verificación
- Decisión: Introducimos dos tipos de precios: "Precio Online" (obtenido por el scraper, considerado verificado por defecto) y "Precio en Tienda" (reportado por usuarios). La validación comunitaria se aplicará únicamente a los "Precios en Tienda".
- Justificación: El precio del scraper es la "verdad oficial" del e-commerce. La comunidad aporta valor detectando ofertas o discrepancias en tienda física.
- Reglas concretas para el MVP:
	- Un "Precio en Tienda" reportado y confirmado por 2 usuarios adicionales se marca como "Oferta Verificada en Tienda".
	- Un reporte de "incorrecto" reduce la visibilidad del reporte y, si suma 2 reportes, lo marca como "en revisión".
- Impacto en el MVP:
	- ✅ Reduce la necesidad de validación manual para la mayoría de precios (confianza inicial basada en scraper).
	- ✅ Centra la validación comunitaria en ofertas y discrepancias físicas.

3) Decisión sobre Gestión de Sucursales
- Decisión: El scraper intentará capturar precios por sucursal si la web lo permite. Para reportes de usuarios, la app usará la geolocalización para auto-sugerir la sucursal.
- Justificación: Datos por sucursal enriquecen la app y la geolocalización mejora la UX del reporte.
- Impacto en el MVP:
	- ✅ Granularidad de datos más alta desde el inicio cuando el e-commerce lo ofrece.
	- 🎯 Requiere integración del formulario de reporte con el servicio de geolocalización.

4) Decisión sobre Política de Puntos
- Decisión: Recompensar aportes que el scraper no puede obtener (ofertas en tienda), con una política de puntos enfocada en descubrir valor único.
- Propuesta MVP (valores iniciales):
	- +25 puntos: Reportar un "Precio en Tienda" más bajo que el "Precio Online" y que sea confirmado por la comunidad.
	- +5 puntos: Ser el primero en confirmar una oferta válida en tienda.
	- +1 punto: Reportar un precio en tienda que coincide con el precio online.
	- -10 puntos: Tu reporte es marcado como "incorrecto" por la comunidad.
- Impacto en el MVP:
	- ✅ Alinea incentivos de usuario con los objetivos de negocio.
	- 🎯 Requiere lógica de backend para comparar reportes con datos del scraper y asignar puntos.

---

## Cambios en Ambiguities & Questions

Se marcan como resueltas las siguientes ambigüedades gracias a las decisiones anteriores:

- **Normalización de Productos**: Resuelto — se usa base maestra generada por el scraper (los usuarios no podrán crear productos en el MVP).
- **Criterio de Verificación**: Resuelto — se distinguen "Precio Online" (scraper, verificado por defecto) y "Precio en Tienda" (comunitario; 2 confirmaciones = "Oferta Verificada").
- **Gestión de Sucursales**: Resuelto — scraper captura por sucursal si está disponible; la app autoselecciona sucursal mediante geolocalización en reportes de usuarios.

Quedan abiertas las siguientes decisiones (necesitan revisión):

- **Política de Puntos**: Propuesta inicial definida arriba; requiere aprobación del equipo de producto y refinamiento tras métricas iniciales.
- **Retención de datos y PII**: No resuelto — definir cuánto tiempo se conservan logs/observaciones y qué datos personales se almacenan.
- **Niveles de usuario y permisos**: No resuelto — definir roles (anónimo, registrado, moderador, admin) y permisos asociados.
- **Canales de notificación para alertas**: No resuelto — confirmar si MVP soporta solo in-app/push o también email/SMS.


