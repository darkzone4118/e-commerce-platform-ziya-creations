import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { sendWhatsAppNotification, formatOrderConfirmationMessage } from '@/lib/whatsapp';

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
      
      if (userPhone) {
        const message = formatOrderConfirmationMessage(order);
        await sendWhatsAppNotification({
          phone: userPhone,
          message,
          orderId: order.orderId,
        });
      }
    } catch (notificationError) {
      // Don't fail the payment if WhatsApp notification fails
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
    return NextResponse.json(
      {
        statusCode: 'FAILED',
        message: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}
