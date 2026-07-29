import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type {
  GeneratedInvoice,
  InvoiceOrderInput,
  InvoiceProvider,
} from "./types";

/**
 * Genera un "comprobante interno" en PDF: el detalle de la compra con formato
 * presentable, SIN validez fiscal.
 *
 * Es lo que corresponde para una tienda sin CUIT ni punto de venta habilitado:
 * el cliente se lleva un respaldo legible de lo que compró y pagó, y el PDF
 * aclara en su propio cuerpo que no es una factura. La aclaración va **dentro
 * del documento** y no solo en la UI que lo descarga, porque el PDF circula
 * solo (se reenvía, se imprime) y tiene que ser autoexplicativo.
 *
 * Usa `pdf-lib` (JS puro, sin dependencias nativas ni binarios de sistema), que
 * es lo que se puede correr en el runtime serverless de Vercel sin fricción.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FACTURACIÓN ELECTRÓNICA REAL (AFIP) — INTEGRACIÓN APARTE, NO PLANIFICADA ACÁ
 * ─────────────────────────────────────────────────────────────────────────────
 * Emitir una factura válida no es "generar otro PDF": requiere obtener un CAE
 * (Código de Autorización Electrónico) de AFIP antes de emitir. Lo que hace
 * falta el día que haya un cliente real con CUIT:
 *
 *   - Certificado digital X.509 + clave privada, generados por el contribuyente
 *     y asociados al servicio WSFEv1 en el portal de AFIP.
 *   - Definir punto de venta y tipo de comprobante (Factura A/B/C según la
 *     condición del vendedor y del comprador frente al IVA).
 *   - Autenticación WSAA (ticket de acceso firmado, con vencimiento) y después
 *     WSFEv1 para solicitar el CAE.
 *   - Numeración correlativa **sin huecos** por punto de venta, persistida y
 *     transaccional: un salto de numeración es una inconsistencia fiscal.
 *   - Cálculo real de IVA discriminado (hoy `Order.taxCents` está en 0).
 *   - Condición fiscal del comprador (CUIT/CUIL/DNI), que hoy no se pide en el
 *     checkout ni existe en el schema.
 *
 * En la práctica conviene NO hablar con AFIP directamente sino vía un
 * intermediario (Alegra, Contabilium, TusFacturas), que resuelve certificados,
 * numeración y contingencias. Eso sería un `afip-provider.ts` que implementa
 * esta misma interfaz — sin tocar nada del resto de la app.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

function formatMoney(cents: number, currency: string): string {
  // Formato manual y no `Intl`: los PDFs con la fuente Helvetica estándar no
  // tienen glyph para el espacio duro que `Intl` mete entre símbolo y número.
  const value = (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${value}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(date);
}

/**
 * Numeración del comprobante interno, derivada del id de la orden.
 *
 * Deliberadamente NO es correlativa: un número correlativo se leería como
 * numeración fiscal, que es justo lo que este documento no tiene. Derivarlo del
 * id lo hace estable (el mismo pedido siempre da el mismo número) y único.
 */
function documentNumberFor(orderId: string): string {
  return `INT-${orderId.slice(-10).toUpperCase()}`;
}

export const internalReceiptProvider: InvoiceProvider = {
  id: "internal-receipt",

  async generateInvoice(order: InvoiceOrderInput): Promise<GeneratedInvoice> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const { width, height } = page.getSize();

    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const ink = rgb(0.1, 0.1, 0.12);
    const muted = rgb(0.45, 0.45, 0.5);
    const line = rgb(0.85, 0.85, 0.88);

    let y = height - MARGIN;

    const text = (
      value: string,
      options: { x?: number; size?: number; font?: typeof regular; color?: typeof ink } = {}
    ) => {
      page.drawText(value, {
        x: options.x ?? MARGIN,
        y,
        size: options.size ?? 10,
        font: options.font ?? regular,
        color: options.color ?? ink,
      });
    };

    /** Texto alineado a la derecha del margen. */
    const textRight = (
      value: string,
      options: { size?: number; font?: typeof regular; color?: typeof ink } = {}
    ) => {
      const size = options.size ?? 10;
      const font = options.font ?? regular;
      page.drawText(value, {
        x: width - MARGIN - font.widthOfTextAtSize(value, size),
        y,
        size,
        font,
        color: options.color ?? ink,
      });
    };

    const rule = () => {
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: width - MARGIN, y },
        thickness: 0.75,
        color: line,
      });
    };

    // ---------- Encabezado ----------
    text("Voltio", { size: 20, font: bold });
    textRight(documentNumberFor(order.orderId), { size: 11, font: bold });
    y -= 16;
    text("Electrónica", { size: 9, color: muted });
    textRight(formatDate(order.createdAt), { size: 9, color: muted });

    // ---------- Aviso de no validez fiscal ----------
    y -= 34;
    page.drawRectangle({
      x: MARGIN,
      y: y - 20,
      width: width - MARGIN * 2,
      height: 42,
      borderColor: line,
      borderWidth: 0.75,
    });
    y -= 2;
    text("COMPROBANTE INTERNO — NO VÁLIDO COMO FACTURA", {
      x: MARGIN + 12,
      size: 10,
      font: bold,
    });
    y -= 14;
    text(
      "Documento de respaldo de la operación. No es un comprobante fiscal ni reemplaza a una factura.",
      { x: MARGIN + 12, size: 8, color: muted }
    );

    // ---------- Datos del comprador ----------
    y -= 44;
    text("Comprador", { size: 9, font: bold, color: muted });
    y -= 15;
    text(order.customerName ?? "Consumidor final");
    if (order.customerEmail) {
      y -= 13;
      text(order.customerEmail, { size: 9, color: muted });
    }

    y -= 22;
    text("Domicilio de entrega", { size: 9, font: bold, color: muted });
    y -= 15;
    text(order.address.line2 ? `${order.address.line1}, ${order.address.line2}` : order.address.line1);
    y -= 13;
    text(
      `${order.address.city}, ${order.address.state} (${order.address.postalCode}) — ${order.address.country}`,
      { size: 9, color: muted }
    );

    // ---------- Detalle ----------
    y -= 30;
    rule();
    y -= 15;
    text("Detalle", { size: 9, font: bold, color: muted });
    textRight("Importe", { size: 9, font: bold, color: muted });
    y -= 8;
    rule();

    for (const item of order.items) {
      y -= 18;
      text(`${item.quantity} × ${item.description}`);
      textRight(formatMoney(item.unitPriceCents * item.quantity, order.currency));

      if (item.variantLabel) {
        y -= 12;
        text(item.variantLabel, { x: MARGIN + 10, size: 8, color: muted });
      }

      y -= 12;
      text(`${formatMoney(item.unitPriceCents, order.currency)} c/u`, {
        x: MARGIN + 10,
        size: 8,
        color: muted,
      });
    }

    // ---------- Totales ----------
    y -= 20;
    rule();

    const totals: Array<[string, number]> = [["Subtotal", order.subtotalCents]];
    if (order.discountCents > 0) totals.push(["Descuento", -order.discountCents]);
    totals.push(["Envío", order.shippingCents]);
    if (order.taxCents > 0) totals.push(["Impuestos", order.taxCents]);

    for (const [label, cents] of totals) {
      y -= 16;
      text(label, { size: 9, color: muted });
      textRight(formatMoney(cents, order.currency), { size: 9 });
    }

    y -= 8;
    rule();
    y -= 18;
    text("Total", { size: 12, font: bold });
    textRight(formatMoney(order.totalCents, order.currency), { size: 12, font: bold });

    y -= 24;
    text(`Medio de pago: ${order.paymentMethodLabel}`, { size: 9, color: muted });
    y -= 13;
    text(`Pedido: ${order.orderId}`, { size: 9, color: muted });

    // ---------- Pie ----------
    page.drawText(
      "Este documento no tiene validez fiscal. Generado automáticamente por Voltio.",
      {
        x: MARGIN,
        y: MARGIN - 12,
        size: 7.5,
        font: regular,
        color: muted,
      }
    );

    return {
      provider: "internal-receipt",
      fileName: `comprobante-${documentNumberFor(order.orderId)}.pdf`,
      mimeType: "application/pdf",
      bytes: await pdf.save(),
      documentNumber: documentNumberFor(order.orderId),
      isFiscallyValid: false,
    };
  },
};
