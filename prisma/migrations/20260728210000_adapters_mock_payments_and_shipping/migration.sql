-- Etapa 2: arquitectura de adaptadores (pagos simulados + envíos).
--
-- 1. `MOCK` como PaymentProviderType real: cuando STORE_MODE=demo el checkout
--    cobra con el adapter simulado. Es un valor de enum y no un flag para que
--    una orden pagada en una demo quede distinguible a nivel de datos, siempre.
-- 2. `PaymentEvent.simulated`: marca el evento como generado por el adapter
--    simulado en vez de por un webhook real del proveedor.
-- 3. Campos de envío en `Order`: los completa el adapter de envíos cuando el
--    pago se aprueba. `shippingProvider` es TEXT y no un enum a propósito — el
--    set de couriers depende del país de la instalación.
--
-- Migración puramente aditiva: no borra ni renombra nada, y todas las columnas
-- nuevas son nullables o tienen DEFAULT, así que las filas existentes quedan
-- válidas sin backfill.

-- AlterEnum
-- Nota: PG permite ADD VALUE dentro de una transacción (PG12+), pero el valor
-- nuevo no se puede *usar* en la misma transacción. Esta migración solo lo
-- agrega, no lo usa, así que es segura.
ALTER TYPE "PaymentProviderType" ADD VALUE 'MOCK';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipmentCreatedAt" TIMESTAMP(3),
ADD COLUMN     "shippingProvider" TEXT,
ADD COLUMN     "trackingId" TEXT;

-- AlterTable
ALTER TABLE "PaymentEvent" ADD COLUMN     "simulated" BOOLEAN NOT NULL DEFAULT false;
