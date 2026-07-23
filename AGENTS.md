<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Decisiones tomadas

- **Auth**: NextAuth v5 (beta), no v4 — es la única versión con soporte real de App Router en Next 16 / React 19. Sesión `jwt`, no database, porque el Credentials provider no soporta sesiones de DB.
- **shadcn/ui**: preset `nova` — esta versión del CLI reemplazó style/base-color por presets con nombre; `nova` es el que trae `baseColor: neutral` por default.
- **Contraseñas**: hash con `crypto.scrypt` nativo de Node, no bcrypt, para no sumar una dependencia que no estaba pedida.
- **Catálogo**: precio e imagen de portada en el listado vienen de la variante más barata; si hay empate de precio entre variantes, se prefiere mostrar la que tiene descuento (`getCheapestVariant` en `src/modules/catalog/types/catalog.ts`) — mostrar el precio tachado es más útil que ocultarlo por el orden en que Postgres devuelve las filas.
- **Pagos**: interfaz común `PaymentProvider` (`src/modules/payments/types/payment-provider.ts`) implementada por adapters en `lib/payments/` (Stripe, Mercado Pago) y elegida por el factory `getPaymentProvider`. El checkout habla siempre con la interfaz, nunca con un SDK. `Order.paymentRef` guarda el id de la transacción del proveedor y es la clave de idempotencia de los webhooks; `orderId` viaja como `metadata`/`external_reference`. Verificación de firma de webhook incluida (Stripe vía `constructEvent`, MP vía HMAC del manifest). Los métodos con decisiones de checkout pendientes tienen `TODO(Paso C/D)`.

## Convención de módulos

Funcionalidad de dominio (no infra genérica como auth) vive en `src/modules/<módulo>/`:

- `types/` — shapes de datos (incluidos los `Prisma.XGetPayload` derivados de los `include` que usan las actions) y helpers puros sobre esos shapes.
- `actions/` — funciones de acceso a datos (lecturas server-only con `prisma`, o server actions reales con `"use server"` si mutan algo).
- `components/` — Server Components por default; Client Component (`"use client"`) solo cuando hay estado/interactividad real.

Ver `src/modules/catalog/` como referencia.
