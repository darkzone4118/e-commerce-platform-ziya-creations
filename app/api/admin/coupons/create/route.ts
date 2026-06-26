import { connectDB } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiryDate,
      description,
    } = body;

    if (!code || !discountType || !discountValue || !minOrderValue || !expiryDate) {
      return createErrorResponse('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return createErrorResponse('Coupon code already exists', 409, 'CODE_EXISTS');
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiryDate: new Date(expiryDate),
      isActive: true,
    });

    await coupon.save();

    return createResponse(coupon, 'Coupon created successfully', 201, 'CREATED');
  } catch (error) {
    return createErrorResponse('Failed to create coupon', 500, 'SERVER_ERROR');
  }
}
