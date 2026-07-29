import "server-only";

import { internalReceiptProvider } from "./internal-receipt-provider";
import type { InvoiceProvider } from "./types";

/**
 * Factory de comprobantes.
 *
 * A diferencia de pagos y envíos, este NO depende de `STORE_MODE`: hoy hay un
 * solo proveedor (el comprobante interno) y es el correcto en los dos modos —
 * una tienda sin CUIT habilitado no puede emitir facturas ni en producción.
 *
 * El día que exista `afip-provider.ts` (ver el comentario largo en
 * `internal-receipt-provider.ts`), acá se elige por env var — probablemente
 * `INVOICE_PROVIDER=afip` más las credenciales del intermediario. La firma de
 * esta función no cambia, y por lo tanto no cambia nada de lo que la llama.
 */
export function getInvoiceProvider(): InvoiceProvider {
  return internalReceiptProvider;
}

export { internalReceiptProvider };
