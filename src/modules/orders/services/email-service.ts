/**
 * Email service interface for sending transactional emails
 * This is a placeholder interface - implement with your preferred email service
 * (SendGrid, Mailgun, SES, etc.) in the future
 */
export interface EmailService {
  /**
   * Send order confirmation email
   * @param orderId - The ID of the order
   * @param customerEmail - Customer's email address
   * @param orderDetails - Order details to include in email
   */
  sendOrderConfirmation(
    orderId: string,
    customerEmail: string,
    orderDetails: {
      items: Array<{
        productName: string;
        quantity: number;
        priceCents: number;
      }>;
      totalCents: number;
      status: string;
    }
  ): Promise<void>;

  /**
   * Send payment failed email
   * @param orderId - The ID of the order
   * @param customerEmail - Customer's email address
   * @param reason - Reason for payment failure
   */
  sendPaymentFailed(
    orderId: string,
    customerEmail: string,
    reason: string
  ): Promise<void>;

  /**
   * Send order shipped email
   * @param orderId - The ID of the order
   * @param customerEmail - Customer's email address
   * @param trackingInfo - Shipping tracking information
   */
  sendOrderShipped(
    orderId: string,
    customerEmail: string,
    trackingInfo: {
      carrier: string;
      trackingNumber: string;
      estimatedDelivery: Date;
    }
  ): Promise<void>;

  /**
   * Send order refunded email
   * @param orderId - The ID of the order
   * @param customerEmail - Customer's email address
   * @param refundAmount - Amount refunded in cents
   */
  sendOrderRefunded(
    orderId: string,
    customerEmail: string,
    refundAmount: number
  ): Promise<void>;
}

/**
 * Mock email service implementation for development
 * In production, replace this with a real email service implementation
 */
export class MockEmailService implements EmailService {
  async sendOrderConfirmation(
    orderId: string,
    customerEmail: string,
    orderDetails: {
      items: Array<{
        productName: string;
        quantity: number;
        priceCents: number;
      }>;
      totalCents: number;
      status: string;
    }
  ): Promise<void> {
    console.log("[EMAIL MOCK] Order confirmation sent:", {
      to: customerEmail,
      subject: `Order Confirmation #${orderId}`,
      body: `Your order #${orderId} has been confirmed. Total: ${
        orderDetails.totalCents / 100
      } USD`,
    });
  }

  async sendPaymentFailed(
    orderId: string,
    customerEmail: string,
    reason: string
  ): Promise<void> {
    console.log("[EMAIL MOCK] Payment failed notification sent:", {
      to: customerEmail,
      subject: `Payment Failed for Order #${orderId}`,
      body: `Payment for order #${orderId} failed: ${reason}`,
    });
  }

  async sendOrderShipped(
    orderId: string,
    customerEmail: string,
    trackingInfo: {
      carrier: string;
      trackingNumber: string;
      estimatedDelivery: Date;
    }
  ): Promise<void> {
    console.log("[EMAIL MOCK] Order shipped notification sent:", {
      to: customerEmail,
      subject: `Order #${orderId} Shipped`,
      body: `Your order #${orderId} has been shipped via ${trackingInfo.carrier}. Tracking: ${trackingInfo.trackingNumber}`,
    });
  }

  async sendOrderRefunded(
    orderId: string,
    customerEmail: string,
    refundAmount: number
  ): Promise<void> {
    console.log("[EMAIL MOCK] Order refunded notification sent:", {
      to: customerEmail,
      subject: `Order #${orderId} Refunded`,
      body: `Order #${orderId} has been refunded. Amount: $${refundAmount / 100}`,
    });
  }
}

/**
 * Factory function to get the email service instance
 * In development, returns the mock service
 * In production, would return the real email service
 */
export function getEmailService(): EmailService {
  // In development, always use mock service
  // In production, check environment variables and return real service
  return new MockEmailService();
}