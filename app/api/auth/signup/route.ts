import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { generateOTP, createResponse, createErrorResponse, hashPassword } from '@/lib/auth';
import { sendEmail, generateOTPEmail } from '@/lib/email';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    // Validation
    if (!name || !email || !phone || !password) {
      return createErrorResponse('All fields are required', 400, 'VALIDATION_ERROR');
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }

    if (!/^\d{10}$/.test(phone)) {
      return createErrorResponse('Phone must be 10 digits', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return createErrorResponse(
        'User already exists with this email or phone',
        409,
        'USER_EXISTS'
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase(), phone },
      {
        email: email.toLowerCase(),
        phone,
        otp,
        expiresAt: otpExpiry,
        attempts: 0,
      },
      { upsert: true }
    );

    // Send OTP email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Verify your email - Ziya Creations',
      html: generateOTPEmail(otp, name),
    });

    if (!emailSent) {
      return createErrorResponse('Failed to send OTP', 500, 'EMAIL_FAILED');
    }

    // Store signup data temporarily (in production, use session/cache)
    return createResponse(
      { email, phone },
      'OTP sent to email. Please verify within 10 minutes',
      200,
      'OTP_SENT'
    );
  } catch (error) {
    return createErrorResponse('Internal server error', 500, 'SERVER_ERROR');
  }
}
