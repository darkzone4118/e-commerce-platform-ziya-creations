import axios from 'axios';

interface WhatsAppMessage {
  phone: string;
  message: string;
  orderId?: string;
}

/**
 * Send WhatsApp notification using available service
 * Supports both Meta's WhatsApp Business API and Twilio
 */
export async function sendWhatsAppNotification(data: WhatsAppMessage): Promise<boolean> {
  try {
    const { phone, message } = data;

    // Format phone number (remove all non-digits)
    const formattedPhone = phone.replace(/\D/g, '');

    if (!formattedPhone) {
      console.error('Invalid phone number provided');
      return false;
    }

    // Try Twilio first (more reliable)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await sendViaTwilio(formattedPhone, message);
    }

    // Fall back to Meta WhatsApp Business API
    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
      return await sendViaMetaAPI(formattedPhone, message);
    }

    console.warn('No WhatsApp service configured');
    return false;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
}

/**
 * Send via Twilio WhatsApp
 */
async function sendViaTwilio(phone: string, message: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155552671'; // Twilio sandbox number by default

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        From: from,
        To: `whatsapp:+${phone}`,
        Body: message,
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('WhatsApp message sent via Twilio:', response.data.sid);
    return true;
  } catch (error: any) {
    console.error('Twilio WhatsApp error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send via Meta WhatsApp Business API
 */
async function sendViaMetaAPI(phone: string, message: string): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_API_URL || '',
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WhatsApp message sent via Meta API:', response.data.messages?.[0]?.id);
    return true;
  } catch (error: any) {
    console.error('Meta WhatsApp API error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Format order confirmation message
 */
export function formatOrderConfirmationMessage(orderData: any): string {
  const itemsList = orderData.items
    .map((item: any) => `• ${item.product?.name} x${item.quantity}`)
    .join('\n');

  return `*Order Confirmed!* ✅

Order ID: *${orderData.orderId}*
Amount: *₹${orderData.total}*

Items:
${itemsList}

Delivery Address:
${orderData.address?.name}
${orderData.address?.street}
${orderData.address?.city} - ${orderData.address?.pincode}

Thank you for shopping with *Ziya Creations*! 🎉

You will receive a shipping update soon.

For support, contact us at support@ziyacreations.com`;
}

/**
 * Format order status update message
 */
export function formatOrderStatusMessage(orderData: any, newStatus: string): string {
  const statusEmojis: Record<string, string> = {
    confirmed: '✅',
    shipped: '📦',
    delivered: '🎉',
    cancelled: '❌',
    pending: '⏳',
  };

  const emoji = statusEmojis[newStatus] || '📋';

  return `*Order Status Update* ${emoji}

Order ID: *${orderData.orderId}*
New Status: *${newStatus.toUpperCase()}*

Thank you for shopping with Ziya Creations!
Track your order at: www.ziyacreations.com/track/${orderData.orderId}`;
}
