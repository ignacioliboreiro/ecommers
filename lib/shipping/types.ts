/**
 * Contrato común de los proveedores de envío. Mismo criterio que
 * `lib/payments/types.ts`: el checkout y la vista de pedido hablan con esta
 * interfaz, nunca con la API de un courier. Cambiar de Correo Argentino a
 * Andreani (o del simulado al real) tiene que ser cambiar una env var.
 *
 * Todos los tipos son agnósticos del courier a propósito: ninguna respuesta
 * cruda de una API externa debe salir de su adapter.
 */

/** Identificador del adapter. Es string y no enum de Prisma: los couriers dependen del país. */
export type ShippingProviderId = "mock" | "correo-argentino" | "andreani";

/**
 * Estados de tracking normalizados. Cada adapter mapea los códigos de su courier
 * a este set — que es chico a propósito: si expusiéramos los ~20 estados de un
 * courier real, la UI quedaría acoplada a ese courier.
 */
export type TrackingStatus =
  | "pending" // envío generado, el courier todavía no lo retiró
  | "shipped" // despachado / en poder del courier
  | "in_transit" // viajando
  | "delivered" // entregado
  | "failed"; // devuelto al remitente / no entregado

/** Destino de un envío. Es el subconjunto del address que un courier necesita para cotizar. */
export interface ShippingAddressInput {
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Ítem a enviar, ya normalizado (sin shapes de Prisma). */
export interface ShippingItemInput {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  /**
   * Peso en gramos. Opcional porque el schema actual NO lo tiene: `ProductVariant`
   * no guarda peso ni dimensiones. Los adapters reales lo van a necesitar (los
   * couriers cotizan por peso y volumen), así que está en la interfaz desde
   * ahora para no romper firmas después. Ver deuda técnica en PROJECT_CONTEXT.md.
   */
  weightGrams?: number;
}

/** Cotización de envío, agnóstica del courier. */
export interface ShippingQuote {
  provider: ShippingProviderId;
  /** Nombre visible del servicio ("Estándar a domicilio", "Sucursal"). */
  serviceName: string;
  costCents: number;
  /** Rango estimado en días hábiles, para mostrar "llega en 3-5 días". */
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  /** true si el costo dio 0 por una regla de envío gratis (no por falta de datos). */
  freeShippingApplied: boolean;
}

/** Datos de la orden que un courier necesita para generar el envío. */
export interface ShippingOrderInput {
  orderId: string;
  address: ShippingAddressInput;
  items: ShippingItemInput[];
  /** Para couriers que piden valor declarado del paquete. */
  declaredValueCents: number;
}

/** Envío recién generado. */
export interface Shipment {
  provider: ShippingProviderId;
  trackingId: string;
  /** URL pública de seguimiento del courier, si tiene una. */
  trackingUrl: string | null;
  status: TrackingStatus;
}

/** Un hito del recorrido, para armar una línea de tiempo en la UI. */
export interface TrackingEvent {
  status: TrackingStatus;
  /** Texto listo para mostrar, en español. */
  label: string;
  at: Date;
}

/** Estado de seguimiento completo. */
export interface ShipmentTracking {
  provider: ShippingProviderId;
  trackingId: string;
  status: TrackingStatus;
  /** Texto del estado actual, listo para mostrar. */
  statusLabel: string;
  trackingUrl: string | null;
  /** Hitos ya ocurridos, del más viejo al más nuevo. */
  history: TrackingEvent[];
  estimatedDeliveryAt: Date | null;
}

export interface ShippingProvider {
  readonly id: ShippingProviderId;

  /** true si el envío se despacha de verdad. El único `false` es el simulado. */
  readonly isReal: boolean;

  /** Cotiza el envío de un carrito a un destino. */
  calculateShippingCost(
    address: ShippingAddressInput,
    items: ShippingItemInput[]
  ): Promise<ShippingQuote>;

  /** Genera el envío/etiqueta para una orden ya pagada. */
  createShipment(order: ShippingOrderInput): Promise<Shipment>;

  /** Consulta el estado de un envío por su id de tracking. */
  trackShipment(trackingId: string): Promise<ShipmentTracking>;
}

/** Etiquetas en español de cada estado, compartidas por todos los adapters. */
export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  pending: "Envío generado",
  shipped: "Despachado",
  in_transit: "En camino",
  delivered: "Entregado",
  failed: "No entregado",
};
