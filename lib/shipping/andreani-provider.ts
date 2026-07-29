import "server-only";

import type {
  Shipment,
  ShipmentTracking,
  ShippingAddressInput,
  ShippingItemInput,
  ShippingOrderInput,
  ShippingProvider,
  ShippingQuote,
  TrackingStatus,
} from "./types";

/**
 * Adapter de Andreani — ESTRUCTURA, SIN INTEGRACIÓN.
 *
 * Se deja junto al de Correo Argentino porque son las dos opciones habituales de
 * un ecommerce argentino y conviene poder cambiar de una a otra por env var. La
 * API de Andreani está mejor documentada y es la que probablemente se implemente
 * primero.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ FALTA PARA ACTIVARLO
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Contrato comercial con Andreani + alta en su portal de desarrolladores
 *    (developers.andreani.com). Dan credenciales de sandbox primero.
 * 2. Credenciales, a poner en `.env`:
 *      ANDREANI_API_KEY          (se manda como header `x-authorization-token`)
 *      ANDREANI_CLIENT_NUMBER    (nro. de cliente del contrato)
 *      ANDREANI_CONTRACT_NUMBER  (nro. de contrato por modalidad: domicilio/sucursal)
 *      ANDREANI_ORIGIN_POSTAL_CODE
 * 3. Datos que el schema todavía NO tiene:
 *      - Peso y dimensiones por variante (`ProductVariant` no los guarda);
 *        Andreani cotiza por peso *y* volumen, así que hacen falta los dos.
 *      - Domicilio de origen del vendedor.
 * 4. Andreani **sí** ofrece webhooks de cambio de estado. Al activarlo hay que:
 *      - Crear `POST /api/webhooks/andreani`.
 *      - Verificar la firma del webhook (mismo criterio que los de pago:
 *        nunca confiar en el payload sin validar el origen).
 *      - Reusar la idempotencia por (provider, ref) como en `PaymentEvent`;
 *        probablemente convenga un modelo `ShipmentEvent` equivalente.
 */

function missingCredentials(): never {
  throw new Error(
    "El adapter de Andreani no está implementado todavía. Falta el contrato y " +
      "las credenciales (ANDREANI_API_KEY, ANDREANI_CLIENT_NUMBER, " +
      "ANDREANI_CONTRACT_NUMBER). Ver lib/shipping/andreani-provider.ts. " +
      "Mientras tanto, usar STORE_MODE=demo o SHIPPING_PROVIDER=mock."
  );
}

/** Mapeo de los estados de Andreani a los nuestros. Revisar contra su doc al integrar. */
export function mapAndreaniStatus(rawStatus: string): TrackingStatus {
  switch (rawStatus.toUpperCase()) {
    case "PENDIENTE_DE_INGRESO":
    case "INGRESADO":
      return "pending";
    case "EN_ORIGEN":
    case "DESPACHADO":
      return "shipped";
    case "EN_TRANSITO":
    case "EN_DISTRIBUCION":
    case "EN_DESTINO":
      return "in_transit";
    case "ENTREGADO":
      return "delivered";
    case "NO_ENTREGADO":
    case "DEVUELTO":
      return "failed";
    default:
      // Un estado desconocido NO se asume entregado.
      return "in_transit";
  }
}

export const andreaniAdapter: ShippingProvider = {
  id: "andreani",
  isReal: true,

  async calculateShippingCost(
    _address: ShippingAddressInput,
    _items: ShippingItemInput[]
  ): Promise<ShippingQuote> {
    // TODO: GET /v1/tarifas?cpDestino=...&contrato=...&bultos[0][kilos]=...
    return missingCredentials();
  },

  async createShipment(_order: ShippingOrderInput): Promise<Shipment> {
    // TODO: POST /v2/ordenes-de-envio → devuelve nro. de envío + etiqueta.
    return missingCredentials();
  },

  async trackShipment(_trackingId: string): Promise<ShipmentTracking> {
    // TODO: GET /v2/envios/{numeroDeEnvio}/trazas; mapear con `mapAndreaniStatus`.
    return missingCredentials();
  },
};
