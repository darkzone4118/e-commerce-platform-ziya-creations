import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { hashPassword, generateToken, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, otp, name, password } = body;

    if (!email || !phone || !otp || !name || !password) {
      return createErrorResponse('All fields are required', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      phone,
    });

    if (!otpRecord) {
      return createErrorResponse('OTP not found or expired', 400, 'OTP_NOT_FOUND');
    }

    if (new Date() > otpRecord.expiresAt) {
      return createErrorResponse('OTP expired', 400, 'OTP_EXPIRED');
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return createErrorResponse('Too many attempts', 429, 'TOO_MANY_ATTEMPTS');
      }
      await otpRecord.save();
      return createErrorResponse('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (!user) {
      // Create new user
      const hashedPassword = await hashPassword(password);
      user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        isVerified: true,
        role: 'customer',
      });
      await user.save();
    } else {
      // Update existing user
      user.isVerified = true;
      await user.save();
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

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
      'Account verified successfully',
      200,
      'VERIFIED'
    );
  } catch (error) {
    return createErrorResponse('Internal server error', 500, 'SERVER_ERROR');
  }
}
