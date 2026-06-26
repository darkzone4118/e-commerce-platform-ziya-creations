import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { statusCode: 'FAILED', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json(
        { statusCode: 'FAILED', message: 'Payment verification failed' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update order status in database to 'paid'
    const order = await Order.findOne({ orderId })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price');

    if (!order) {
      return NextResponse.json(
        { statusCode: 'FAILED', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Mark order as paid
    order.paymentStatus = 'completed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.status = 'confirmed';
    await order.save();

    // Send WhatsApp notification if user phone is available
    try {
      const userPhone = order.user?.phone || '';
      const formattedPhone = userPhone.replace(/\D/g, '');
      
      if (formattedPhone && process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
        const itemsList = order.items
          .map((item: any) => `• ${item.product?.name} x${item.quantity}`)
          .join('\n');

        const whatsappMessage = `*Order Confirmed!* ✅

Order ID: *${order.orderId}*
Amount: *₹${order.total}*

Items:
${itemsList}

Delivery Address:
${order.address?.name}
${order.address?.street}
${order.address?.city} - ${order.address?.pincode}

Thank you for shopping with *Ziya Creations*!

You will receive a shipping update soon.`;

        try {
          // Send via WhatsApp Business API or similar
          await axios.post(
            process.env.WHATSAPP_API_URL,
            {
              phone: formattedPhone,
              message: whatsappMessage,
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
              },
            }
          );
          console.log('[v0] WhatsApp notification sent for order:', orderId);
        } catch (whatsappError) {
          console.error('[v0] WhatsApp notification error:', whatsappError);
          // Don't fail the payment if WhatsApp notification fails
        }
      }
    } catch (notificationError) {
      console.error('[v0] Notification processing error:', notificationError);
      // Don't fail the payment if notification fails
    }

    return NextResponse.json(
      {
        statusCode: 'SUCCESS',
        message: 'Payment verified successfully',
        data: {
          orderId,
          razorpayPaymentId,
          status: 'paid',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Payment verification error:', error);
    return NextResponse.json(
      {
        statusCode: 'FAILED',
        message: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}
