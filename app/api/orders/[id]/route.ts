import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    // Only show paid orders
    const order = await Order.findOne({ orderId: params.id, user: auth.userId, paymentStatus: 'completed' })
      .populate('items.product', 'name price images')
      .populate('address');

    if (!order) {
      return createErrorResponse('Order not found', 404, 'NOT_FOUND');
    }

    return createResponse(order, 'Order fetched successfully', 200, 'SUCCESS');
  } catch (error) {
    console.error('[v0] Get order error:', error);
    return createErrorResponse('Failed to fetch order', 500, 'SERVER_ERROR');
  }
}
