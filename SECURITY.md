# Seguridad

## Row-Level Security (RLS) en Postgres/Supabase

**Estado: habilitado en las 18 tablas del esquema `public`, sin policies.**

Migración: [`prisma/migrations/20260728170000_enable_rls/migration.sql`](prisma/migrations/20260728170000_enable_rls/migration.sql)

### Qué se hizo

Se ejecutó `ENABLE ROW LEVEL SECURITY` sobre las 18 tablas de `public`:

`User`, `Account`, `Session`, `Address`, `Category`, `Product`, `ProductImage`,
`ProductVariant`, `StockMovement`, `Review`, `Cart`, `CartItem`, `Order`,
`OrderItem`, `OrderStatusChange`, `PaymentEvent`, `Coupon`, `_prisma_migrations`.

**No se creó ninguna policy** — ni para `anon` ni para `authenticated`.

### Por qué

Auditamos cómo la aplicación accede a los datos y confirmamos que:

- **`supabase-js` no está instalado** ni referenciado en ningún lado. Supabase
  se usa exclusivamente como **host de PostgreSQL**, vía el connection string
  de Postgres — no vía su API REST (PostgREST).
- **Todo el acceso a datos ocurre en el servidor.** Los 22 archivos que usan
  Prisma son de servidor; la intersección con archivos `"use client"` es vacía.
  Los pocos imports de `@prisma/client` en componentes cliente son `import type`,
  que TypeScript borra al compilar (no llegan al bundle del navegador).
- Los únicos dos `fetch()` de código cliente apuntan a rutas internas de la
  propia app (`/api/payments/mercadopago/process`, `/api/orders/[id]/status`).
- `DATABASE_URL` / `DIRECT_URL` **no** están expuestas como `NEXT_PUBLIC_*`.

En ese escenario, RLS activo **sin policies** cierra por defecto la superficie
de ataque: si en el futuro alguien expusiera la API REST de Supabase, o si se
filtrara la `anon key`, las tablas no serían legibles ni escribibles desde
afuera. Es una medida **defensiva**, no un cambio en el control de acceso actual.

### Por qué esto NO rompió la aplicación

La app se conecta con el rol **`postgres`**, que tiene el atributo
**`BYPASSRLS`**. Verificado directamente contra la base:

```
current_user = "postgres" | rolbypassrls = true
```

Las policies (o su ausencia) **no se aplican a un rol con `BYPASSRLS`**. Por eso
habilitar RLS es transparente para Prisma.

> ⚠️ **La contracara, que conviene tener presente:** por el mismo motivo, RLS
> hoy **no protege** contra un bug en el código de la aplicación. El control de
> acceso real lo sigue haciendo la app:
> - Datos de usuario: filtrado por `userId` **dentro del `where`** de la query
>   (ver `getOrderForUser` en `src/modules/orders/actions/get-order.ts`), de modo
>   que un recurso ajeno es indistinguible de uno inexistente (404, sin revelar
>   existencia).
> - Panel admin: `requireAdmin()` al inicio de **cada** Server Action
>   (`src/modules/admin/actions/require-admin.ts`). `proxy.ts` protege *rutas*,
>   pero una Server Action puede invocarse directo sin pasar por la ruta.

### Verificación posterior

Tras aplicar la migración se verificaron los paths críticos contra el servidor
y la base reales (Playwright), con resultado **sin regresiones**:

| Flujo | Tablas involucradas | Resultado |
|---|---|---|
| Catálogo (home, listado, detalle) | `Product`, `Category`, `ProductImage`, `ProductVariant` | ✅ |
| Registro / login / sesión | `User`, `Account`, `Session` | ✅ |
| Carrito | `Cart`, `CartItem` | ✅ |
| Checkout / creación de orden | `Order`, `OrderItem`, `StockMovement`, `ProductVariant` | ✅ |
| Pedidos del usuario | `Order` (filtrado por `userId`) | ✅ |
| Panel admin: dashboard | `Order` (aggregate/groupBy), `ProductVariant` | ✅ |
| Panel admin: editar producto y stock | `Product`, `ProductVariant` | ✅ |
| Panel admin: listado de pedidos | `Order` (sin filtro de usuario) | ✅ |

---

## ⚠️ Si en el futuro se usa `supabase-js` desde el cliente

Lo de arriba deja de ser suficiente en el momento en que el navegador hable
**directamente** con Supabase (por ejemplo para **Realtime**, Storage, o queries
desde el cliente con la `anon key`).

En ese caso, la conexión ya **no** usa el rol `postgres`: usa `anon` o
`authenticated`, que **sí respetan RLS**. Con la configuración actual (RLS
activo, cero policies) el resultado sería que **toda query desde el cliente
devuelve vacío o falla** — no es un fallo silencioso peligroso, pero sí
bloqueante.

Antes de habilitar ese acceso hay que elegir una de estas dos vías:

1. **Escribir policies reales.** Por cada tabla que se exponga, definir policies
   con `auth.uid()`. Ojo: esto requiere que el JWT de Supabase corresponda al
   usuario, y **hoy la sesión la maneja NextAuth con estrategia `jwt`**, no
   Supabase Auth — habría que puentear ambos sistemas (por ejemplo, firmando un
   JWT compatible con Supabase). No es un cambio trivial.

2. **Rol dedicado sin `BYPASSRLS`.** Crear un rol de Postgres propio para la app,
   sin `BYPASSRLS`, apuntar `DATABASE_URL` a ese rol, y escribir policies que
   cubran **todo** el acceso del backend. Es la opción más rigurosa (RLS pasaría
   a ser una red de seguridad real también para bugs de la app), pero exige
   auditar cada query existente antes de migrar.

En cualquiera de los dos casos: **no agregar policies permisivas del tipo
`USING (true)` para `anon`** — eso reabre exactamente la superficie que esta
medida cierra.
