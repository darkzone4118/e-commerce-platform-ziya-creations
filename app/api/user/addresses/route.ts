import { connectDB } from '@/lib/db';
import Address from '@/lib/models/Address';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    const addresses = await Address.find({ user: auth.userId }).sort('-createdAt');

    return createResponse(addresses, 'Addresses fetched successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to fetch addresses', 500, 'SERVER_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { name, phone, email, street, city, state, pincode, type, isDefault } = body;

    if (!name || !phone || !street || !city || !state || !pincode) {
      return createErrorResponse('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // If setting as default, unset previous default
    if (isDefault) {
      await Address.updateMany({ user: auth.userId }, { isDefault: false });
    }

    const address = new Address({
      user: auth.userId,
      name,
      phone,
      email,
      street,
      city,
      state,
      pincode,
      type: type || 'home',
      isDefault: isDefault || false,
    });

    await address.save();

    return createResponse(address, 'Address created successfully', 201, 'CREATED');
  } catch (error) {
    return createErrorResponse('Failed to create address', 500, 'SERVER_ERROR');
  }
}
