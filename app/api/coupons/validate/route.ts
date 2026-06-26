import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || !cartTotal) {
      return createErrorResponse('Code and cartTotal are required', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    if (!coupon) {
      return createErrorResponse('Invalid or expired coupon', 400, 'INVALID_COUPON');
    }

    if (cartTotal < coupon.minOrderValue) {
      return createErrorResponse(
        `Minimum order value of ₹${coupon.minOrderValue} required`,
        400,
        'MIN_ORDER_VALUE'
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return createErrorResponse('Coupon usage limit reached', 400, 'USAGE_LIMIT_REACHED');
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((cartTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    return createResponse(
      {
        coupon,
        discount,
      },
      'Coupon validated successfully',
      200,
      'SUCCESS'
    );
  } catch (error) {
    return createErrorResponse('Failed to validate coupon', 500, 'SERVER_ERROR');
  }
}
