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
 * Adapter de Correo Argentino — ESTRUCTURA, SIN INTEGRACIÓN.
 *
 * Está escrito para que el día que haya credenciales solo haya que reemplazar
 * los cuerpos de los tres métodos: la firma, el mapeo de estados y el manejo de
 * errores ya están definidos, y nada fuera de este archivo cambia.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ FALTA PARA ACTIVARLO
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Cuenta comercial de Correo Argentino (Paq.ar / Mi Correo Empresas). No se
 *    puede usar la cuenta de un particular: la API de cotización y generación de
 *    etiquetas es solo del canal empresas.
 * 2. Credenciales, a poner en `.env`:
 *      CORREO_ARGENTINO_API_KEY
 *      CORREO_ARGENTINO_CUSTOMER_ID     (nro. de cliente del contrato)
 *      CORREO_ARGENTINO_AGREEMENT_ID    (nro. de acuerdo/tarifa asignado)
 *      CORREO_ARGENTINO_ORIGIN_POSTAL_CODE  (CP del depósito de origen)
 * 3. Datos que el schema todavía NO tiene y la API pide:
 *      - Peso y dimensiones por variante (`ProductVariant` no los guarda).
 *      - Domicilio de origen del vendedor (hoy no existe en ninguna tabla).
 *    Ver deuda técnica en PROJECT_CONTEXT.md.
 * 4. Definir modalidad: entrega a domicilio vs. retiro en sucursal. Si se ofrece
 *    sucursal hay que agregar un selector de sucursal al checkout (y guardar la
 *    sucursal elegida en la orden), que hoy no existe.
 * 5. Webhook/polling de tracking: Correo Argentino no notifica cambios de estado,
 *    hay que consultar. Conviene un cron (ya hay uno para expirar órdenes, ver
 *    `vercel.json`) que refresque los envíos en curso.
 */

function missingCredentials(): never {
  throw new Error(
    "El adapter de Correo Argentino no está implementado todavía. " +
      "Falta la cuenta de Mi Correo Empresas y las credenciales " +
      "(CORREO_ARGENTINO_API_KEY, CORREO_ARGENTINO_CUSTOMER_ID, " +
      "CORREO_ARGENTINO_AGREEMENT_ID). Ver lib/shipping/correo-argentino-provider.ts. " +
      "Mientras tanto, usar STORE_MODE=demo o SHIPPING_PROVIDER=mock."
  );
}

/**
 * Mapeo de los estados de Correo Argentino a los nuestros. Se deja escrito
 * aunque no se use todavía porque es la parte que hay que revisar contra la
 * documentación real, y es donde se cometen los errores.
 */
export function mapCorreoArgentinoStatus(rawStatus: string): TrackingStatus {
  switch (rawStatus.toUpperCase()) {
    case "INGRESADO":
    case "ADMITIDO":
      return "pending";
    case "DESPACHADO":
      return "shipped";
    case "EN_TRANSITO":
    case "EN_DISTRIBUCION":
      return "in_transit";
    case "ENTREGADO":
      return "delivered";
    case "DEVUELTO_AL_REMITENTE":
    case "NO_ENTREGADO":
      return "failed";
    default:
      // Un estado desconocido NO se asume entregado: se trata como "en camino".
      return "in_transit";
  }
}

export const correoArgentinoAdapter: ShippingProvider = {
  id: "correo-argentino",
  isReal: true,

  async calculateShippingCost(
    _address: ShippingAddressInput,
    _items: ShippingItemInput[]
  ): Promise<ShippingQuote> {
    // TODO: POST a la API de cotización (requiere peso total y CP origen/destino).
    return missingCredentials();
  },

  async createShipment(_order: ShippingOrderInput): Promise<Shipment> {
    // TODO: POST de alta de envío; devuelve nro. de seguimiento y PDF de etiqueta.
    // Habrá que decidir dónde se guarda la etiqueta (Cloudinary ya está configurado).
    return missingCredentials();
  },

  async trackShipment(_trackingId: string): Promise<ShipmentTracking> {
    // TODO: GET de seguimiento; mapear con `mapCorreoArgentinoStatus`.
    return missingCredentials();
  },
};
