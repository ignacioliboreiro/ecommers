-- Habilita Row-Level Security (RLS) en todas las tablas del esquema public.
--
-- POR QUÉ: la app accede a la base exclusivamente desde el servidor (Prisma en
-- Server Components / Server Actions). `supabase-js` no está instalado y no hay
-- ningún acceso directo desde el navegador. Sin RLS, si en el futuro se expusiera
-- la API REST de Supabase (PostgREST) o se filtrara la `anon key`, las tablas
-- quedarían legibles/escribibles desde afuera. Con RLS activo y SIN policies,
-- esa superficie queda cerrada por defecto.
--
-- DELIBERADAMENTE NO SE CREAN POLICIES: el control de acceso real lo hace el
-- código de la aplicación (filtrado por userId en el `where`, requireAdmin() en
-- las Server Actions del panel). Cualquier policy permisiva para anon/authenticated
-- reabriría justamente la superficie que esto cierra.
--
-- NOTA IMPORTANTE: la app se conecta con el rol `postgres`, que tiene BYPASSRLS.
-- Por eso esta migración NO altera el comportamiento actual de la app; su valor
-- es defensivo a futuro. Si algún día se usa supabase-js desde el cliente
-- (ej. Realtime), habrá que crear policies reales con auth.uid() o usar un rol
-- dedicado sin BYPASSRLS. Ver SECURITY.md.
--
-- Idempotente: `ENABLE ROW LEVEL SECURITY` no falla si ya está habilitado, así
-- que esta migración es segura de re-aplicar sobre una base que ya lo tenga.

-- Usuarios y auth
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

-- Catálogo
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Carrito
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;

-- Órdenes y pagos
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusChange" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

-- Tabla interna de Prisma (se incluye para no dejar ninguna tabla de public
-- sin RLS; Prisma la accede con el rol postgres, que la bypassa igual).
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
