import "server-only";

import {
  TRACKING_STATUS_LABELS,
  type Shipment,
  type ShipmentTracking,
  type ShippingAddressInput,
  type ShippingItemInput,
  type ShippingOrderInput,
  type ShippingProvider,
  type ShippingQuote,
  type TrackingEvent,
  type TrackingStatus,
} from "./types";

/**
 * Proveedor de envíos simulado (`STORE_MODE=demo`).
 *
 * Cotiza con una fórmula por zona y hace *avanzar el tracking solo*, en función
 * del tiempo transcurrido desde que se generó el envío. Eso es para que una demo
 * que un cliente abre dos días después se vea viva ("En camino", "Entregado")
 * sin que nadie tenga que tocar nada a mano.
 *
 * El tiempo de creación va codificado en el propio `trackingId` en vez de leerse
 * de la base. Así `trackShipment` es puro y autocontenido: cumple la firma real
 * de la interfaz (que recibe solo un trackingId, porque es lo único que un
 * courier real acepta) sin necesitar acceso a datos que un courier no tendría.
 */

// ---------- Cotización ----------

/**
 * Envío gratis a partir de este total. Calibrado contra el catálogo actual
 * (~$390.000 los auriculares más baratos, ~$1.190.000 un teléfono) para que en
 * una demo se vean los dos casos: pedidos chicos pagan envío, pedidos grandes no.
 */
const FREE_SHIPPING_FROM_CENTS = 100_000_000; // $1.000.000

/** Provincias por zona tarifaria (normalizadas sin acentos ni mayúsculas). */
const ZONE_METRO = ["caba", "ciudad autonoma de buenos aires", "capital federal", "buenos aires"];
const ZONE_CENTRO = [
  "santa fe",
  "cordoba",
  "entre rios",
  "la pampa",
  "mendoza",
  "san luis",
];

interface ZoneRate {
  serviceName: string;
  baseCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

// Tarifas en centavos: 650_000 = $6.500.
const RATES: Record<"metro" | "centro" | "resto", ZoneRate> = {
  metro: { serviceName: "Estándar a domicilio (AMBA)", baseCents: 650_000, estimatedDaysMin: 2, estimatedDaysMax: 4 },
  centro: { serviceName: "Estándar a domicilio (Centro)", baseCents: 950_000, estimatedDaysMin: 3, estimatedDaysMax: 6 },
  resto: { serviceName: "Estándar a domicilio (Interior)", baseCents: 1_400_000, estimatedDaysMin: 5, estimatedDaysMax: 9 },
};

/** Recargo por cada unidad adicional a la primera (bultos extra): $1.200. */
const EXTRA_UNIT_CENTS = 120_000;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Quita los diacríticos que NFD dejó sueltos, para que "Córdoba" matchee
    // "cordoba". Escapes explícitos: el rango literal es invisible en el editor.
    .replace(/[\u0300-\u036f]/g, "");
}

function zoneFor(address: ShippingAddressInput): "metro" | "centro" | "resto" {
  const state = normalize(address.state);
  if (ZONE_METRO.includes(state)) return "metro";
  if (ZONE_CENTRO.includes(state)) return "centro";
  return "resto";
}

// ---------- Tracking ----------

const TRACKING_PREFIX = "DEMO";

/**
 * Hitos del recorrido simulado, en horas desde la creación del envío.
 * Comprimido a propósito: en 3 días una demo recorre el ciclo completo.
 */
const TRACKING_STEPS: ReadonlyArray<{ afterHours: number; status: TrackingStatus; label: string }> = [
  { afterHours: 0, status: "pending", label: "Envío generado, esperando retiro del courier" },
  { afterHours: 2, status: "shipped", label: "Despachado desde el depósito" },
  { afterHours: 24, status: "in_transit", label: "En camino a destino" },
  { afterHours: 72, status: "delivered", label: "Entregado" },
];

const DELIVERED_AFTER_HOURS = TRACKING_STEPS[TRACKING_STEPS.length - 1].afterHours;

/** `DEMO-<ms en base36>-<sufijo del orderId>` */
function buildTrackingId(orderId: string, createdAt: Date): string {
  const stamp = createdAt.getTime().toString(36).toUpperCase();
  const suffix = orderId.slice(-6).toUpperCase();
  return `${TRACKING_PREFIX}-${stamp}-${suffix}`;
}

function parseCreatedAt(trackingId: string): Date | null {
  const parts = trackingId.split("-");
  if (parts[0] !== TRACKING_PREFIX || parts.length < 3) return null;

  const ms = parseInt(parts[1], 36);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : null;
}

function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

// ---------- Adapter ----------

export const mockShippingAdapter: ShippingProvider = {
  id: "mock",
  isReal: false,

  async calculateShippingCost(
    address: ShippingAddressInput,
    items: ShippingItemInput[]
  ): Promise<ShippingQuote> {
    const zone = zoneFor(address);
    const rate = RATES[zone];

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

    if (subtotalCents >= FREE_SHIPPING_FROM_CENTS) {
      return {
        provider: "mock",
        serviceName: rate.serviceName,
        costCents: 0,
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
        freeShippingApplied: true,
      };
    }

    const extraUnits = Math.max(0, totalUnits - 1);

    return {
      provider: "mock",
      serviceName: rate.serviceName,
      costCents: rate.baseCents + extraUnits * EXTRA_UNIT_CENTS,
      estimatedDaysMin: rate.estimatedDaysMin,
      estimatedDaysMax: rate.estimatedDaysMax,
      freeShippingApplied: false,
    };
  },

  async createShipment(order: ShippingOrderInput): Promise<Shipment> {
    // Sin llamada de red: el "courier" es esta función.
    return {
      provider: "mock",
      trackingId: buildTrackingId(order.orderId, new Date()),
      // Un tracking simulado no tiene URL pública: mandar al usuario al sitio de
      // un courier real con un código inventado daría un error confuso.
      trackingUrl: null,
      status: "pending",
    };
  },

  async trackShipment(trackingId: string): Promise<ShipmentTracking> {
    const createdAt = parseCreatedAt(trackingId);
    if (!createdAt) {
      throw new Error(`Tracking id simulado inválido: ${trackingId}`);
    }

    const elapsedHours = hoursBetween(createdAt, new Date());

    const history: TrackingEvent[] = TRACKING_STEPS.filter(
      (step) => elapsedHours >= step.afterHours
    ).map((step) => ({
      status: step.status,
      label: step.label,
      at: new Date(createdAt.getTime() + step.afterHours * 60 * 60 * 1000),
    }));

    // `history` nunca está vacío: el primer hito es a las 0 horas.
    const current = history[history.length - 1];
    const isDelivered = current.status === "delivered";

    return {
      provider: "mock",
      trackingId,
      status: current.status,
      statusLabel: TRACKING_STATUS_LABELS[current.status],
      trackingUrl: null,
      history,
      estimatedDeliveryAt: isDelivered
        ? current.at
        : new Date(createdAt.getTime() + DELIVERED_AFTER_HOURS * 60 * 60 * 1000),
    };
  },
};
