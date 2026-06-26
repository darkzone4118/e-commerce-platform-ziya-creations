import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    // Verify user is admin or super_admin
    const user = await User.findById(auth.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return createErrorResponse('Forbidden', 403, 'FORBIDDEN');
    }

    const { status, page = 1, limit = 10 } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on status
    const filter: any = {};
    if (status && status !== 'all') {
      filter.paymentStatus = status;
    }

    // Only show paid orders
    const orders = await Order.find({ ...filter, paymentStatus: 'completed' })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments({ ...filter, paymentStatus: 'completed' });

    return createResponse(
      {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Orders fetched successfully',
      200,
      'SUCCESS'
    );
  } catch (error) {
    console.error('[v0] Get admin orders error:', error);
    return createErrorResponse('Failed to fetch orders', 500, 'SERVER_ERROR');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    // Verify user is admin or super_admin
    const user = await User.findById(auth.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return createErrorResponse('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return createErrorResponse('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone').populate('items.product', 'name price images');

    if (!order) {
      return createErrorResponse('Order not found', 404, 'NOT_FOUND');
    }

    return createResponse(order, 'Order updated successfully', 200, 'SUCCESS');
  } catch (error) {
    console.error('[v0] Update order error:', error);
    return createErrorResponse('Failed to update order', 500, 'SERVER_ERROR');
  }
}
