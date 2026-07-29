/**
 * Contrato común de los proveedores de comprobantes. Mismo criterio que
 * `lib/payments/types.ts` y `lib/shipping/types.ts`: quien pide un comprobante
 * no sabe si lo genera un PDF interno o AFIP.
 */

export type InvoiceProviderId = "internal-receipt" | "afip";

/** Datos de la orden que hacen falta para emitir un comprobante. */
export interface InvoiceOrderInput {
  orderId: string;
  createdAt: Date;
  /** Nombre del comprador si lo conocemos (guests pueden no tenerlo). */
  customerName: string | null;
  customerEmail: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    description: string;
    /** Atributos de la variante ya formateados ("color: Negro"). */
    variantLabel: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  /** Nombre del medio de pago para mostrar en el comprobante. */
  paymentMethodLabel: string;
}

/** Comprobante generado, listo para devolver por HTTP o adjuntar a un email. */
export interface GeneratedInvoice {
  provider: InvoiceProviderId;
  /** Nombre sugerido de archivo, sin path. */
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  /**
   * Numeración del comprobante. Para el proveedor interno es derivada del id de
   * la orden; para AFIP sería el número de comprobante autorizado.
   */
  documentNumber: string;
  /**
   * false para todo lo que no sea una factura electrónica autorizada. La UI usa
   * esto para no llamar "factura" a algo que no lo es.
   */
  isFiscallyValid: boolean;
}

export interface InvoiceProvider {
  readonly id: InvoiceProviderId;
  generateInvoice(order: InvoiceOrderInput): Promise<GeneratedInvoice>;
}
