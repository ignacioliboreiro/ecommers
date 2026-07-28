import { prisma } from "@/lib/prisma";
import type { CartWithItems } from "@/src/modules/cart/types/cart";

export async function createOrderFromCart(
  cart: CartWithItems | null,
  addressId: string | null,
  addressDetails: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  } | null,
  paymentProvider: "STRIPE" | "MERCADO_PAGO",
  contactEmail?: string | null
) {
  // 1. Validate cart
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // 2. IDEMPOTENCY CHECK: Check if there's already an active order for this user/guest
  // An active order is one that's not in a terminal state (PAID, CANCELLED, REFUNDED, EXPIRED)
  // Since each user/guest can only have one cart (userId and guestId are @unique in Cart model),
  // checking by userId/guestId is sufficient to prevent duplicate orders for the same cart.
  // IMPORTANTE: filtrar los null explícitamente — `{ guestId: null }` no es falsy para
  // `.filter(Boolean)`, así que un OR sin este filtro matchearía la orden PENDING_PAYMENT
  // de CUALQUIER usuario logueado (todas comparten guestId: null).
  const whereConditions: Array<{ userId: string } | { guestId: string }> = [
    cart.userId ? { userId: cart.userId } : null,
    cart.guestId ? { guestId: cart.guestId } : null,
  ].filter((condition): condition is { userId: string } | { guestId: string } => condition !== null);

  const existingOrder = await prisma.order.findFirst({
    where: {
      OR: whereConditions,
      status: {
        notIn: ["PAID", "CANCELLED", "REFUNDED", "EXPIRED"]
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // If we found an existing active order, return it (idempotency)
  if (existingOrder) {
    return existingOrder;
  }

  // 3. Determine address source and validate
  let addressSnapshot: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  };

  if (addressId) {
    // Using address from address book (for logged-in users)
    if (!cart.userId) {
      throw new Error("Address ID provided for guest cart");
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error("Address not found");
    }

    if (address.userId !== cart.userId) {
      throw new Error("Address does not belong to the user");
    }

    addressSnapshot = {
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? null,
    };
  } else if (addressDetails) {
    // Using address details from form (for guest users or when address not in address book)
    if (!addressDetails.street || !addressDetails.city || !addressDetails.state || !addressDetails.postalCode || !addressDetails.country) {
      throw new Error("Missing required address fields");
    }

    addressSnapshot = {
      street: addressDetails.street,
      city: addressDetails.city,
      state: addressDetails.state,
      postalCode: addressDetails.postalCode,
      country: addressDetails.country,
      phone: addressDetails.phone ?? null,
    };
  } else {
    throw new Error("Either addressId or addressDetails must be provided");
  }

  // 4. Validate cart items: product existence, active status, and stock
  const productIds = cart.items.map((item) => item.variant.productId);
  const variantIds = cart.items.map((item) => item.variantId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: { id: true, isActive: true },
  });

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      product: { isActive: true },
    },
    select: { id: true, productId: true, stock: true },
  });

  // Check each item
  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.variant.productId);
    const variant = variants.find((v) => v.id === item.variantId);

    if (!product || !product.isActive) {
      throw new Error(`Product ${item.variant.productId} is not available`);
    }

    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.variant.productId}. Available: ${variant.stock}, requested: ${item.quantity}`);
    }
  }

  // 5. Calculate totals
  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.variant.priceCents * item.quantity,
    0
  );
  const discountCents = 0; // TODO: implement coupons
  const taxCents = 0; // TODO: implement tax calculation
  const shippingCents = 0; // TODO: implement shipping calculation
  const totalCents = subtotalCents + shippingCents + taxCents - discountCents;

  // 6. Set expiration for pending payment (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // 7. Create order and order items in a transaction (WITH stock reservation)
  const result = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        userId: cart.userId,
        guestId: cart.guestId,
        status: "PENDING_PAYMENT",
        subtotalCents,
        discountCents,
        taxCents,
        shippingCents,
        totalCents,
        // TODO: make configurable based on location. Mercado Pago Argentina
        // solo cobra en ARS (los precios del catálogo ya están en ARS, ver
        // formatCents en lib/money.ts) — con USD la API rechaza el monto.
        currency: paymentProvider === "MERCADO_PAGO" ? "ARS" : "USD",
        paymentProvider,
        contactEmail: contactEmail ?? null,
        // Denormalized address (note: Order model uses addressLine1 for street)
        addressLine1: addressSnapshot.street,
        city: addressSnapshot.city,
        state: addressSnapshot.state,
        postalCode: addressSnapshot.postalCode,
        country: addressSnapshot.country,
        phone: addressSnapshot.phone,
        expiresAt,
      },
    });

    // Create order items
    const orderItems = cart.items.map((item) => ({
      orderId: order.id,
      productId: item.variant.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceCents: item.variant.priceCents, // price at time of purchase
    }));

    await tx.orderItem.createMany({
      data: orderItems,
    });

    // Reserve stock: create stock movements of type RESERVATION (negative quantity)
    const stockReservations = cart.items.map((item) => ({
      variantId: item.variantId,
      type: "RESERVATION" as const,
      quantity: -item.quantity, // negative = stock reserved
      note: `Order ${order.id}`,
    }));

    await tx.stockMovement.createMany({
      data: stockReservations,
    });

    // Reflejar la reserva en el stock disponible (StockMovement es el historial,
    // ProductVariant.stock es lo que lee la UI de catálogo/carrito).
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // NOTE: Do NOT clear the cart here - it will be cleared when payment is confirmed
    // via webhook handlers

    return { order, orderItems };
  });

  return result.order;
}