import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { comparePassword, generateToken, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.password) {
      return createErrorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Only customers need email verification. Admins/Super Admins skip this
    if (!user.isVerified && user.role === 'customer') {
      return createErrorResponse('Please verify your email first', 403, 'NOT_VERIFIED');
    }

    // SECURITY: Reject admin/superadmin from customer login
    if (user.role === 'admin' || user.role === 'super_admin') {
      return createErrorResponse(
        'Admin accounts cannot login from customer portal. Please use the admin login page.',
        401,
        'ADMIN_RESTRICTED'
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return createResponse(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      'Login successful',
      200,
      'SUCCESS'
    );
  } catch (error) {
    return createErrorResponse('Internal server error', 500, 'SERVER_ERROR');
  }
}
