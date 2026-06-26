import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return createErrorResponse('Missing payment details', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Verify Razorpay signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return createErrorResponse('Invalid payment signature', 400, 'INVALID_SIGNATURE');
    }

    // Update order
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: 'completed',
        status: 'confirmed',
      },
      { new: true }
    );

    if (!order) {
      return createErrorResponse('Order not found', 404, 'NOT_FOUND');
    }

    return createResponse(order, 'Payment verified successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to verify payment', 500, 'SERVER_ERROR');
  }
}
