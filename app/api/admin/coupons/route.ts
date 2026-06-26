import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
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

    const { page = 1, limit = 10 } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const coupons = await Coupon.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Coupon.countDocuments();

    return createResponse(
      {
        coupons,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Coupons fetched successfully',
      200,
      'SUCCESS'
    );
  } catch (error) {
    return createErrorResponse('Failed to fetch coupons', 500, 'SERVER_ERROR');
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
    const { couponId, ...updateData } = body;

    if (!couponId) {
      return createErrorResponse('Missing coupon ID', 400, 'VALIDATION_ERROR');
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!coupon) {
      return createErrorResponse('Coupon not found', 404, 'NOT_FOUND');
    }

    return createResponse(coupon, 'Coupon updated successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to update coupon', 500, 'SERVER_ERROR');
  }
}

export async function DELETE(request: NextRequest) {
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

    const { couponId } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    if (!couponId) {
      return createErrorResponse('Missing coupon ID', 400, 'VALIDATION_ERROR');
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return createErrorResponse('Coupon not found', 404, 'NOT_FOUND');
    }

    return createResponse({ couponId }, 'Coupon deleted successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to delete coupon', 500, 'SERVER_ERROR');
  }
}
