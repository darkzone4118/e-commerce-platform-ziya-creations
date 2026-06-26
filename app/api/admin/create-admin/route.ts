import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password, name, phone } = await req.json();
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Verify token exists
    if (!token) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode JWT token to get userId
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is super admin
    const superAdmin = await User.findById(decoded.userId);
    if (!superAdmin || superAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Only Super Admin can create admins' },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const newAdmin = new User({
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      role: 'admin',
      isEmailVerified: true,
    });

    await newAdmin.save();

    return NextResponse.json(
      {
        statusCode: 'SUCCESS',
        message: 'Admin created successfully',
        data: {
          id: newAdmin._id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { statusCode: 'ERROR', message: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

// GET all admins (Super Admin only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Verify token exists
    if (!token) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify super admin
    const superAdmin = await User.findById(decoded.userId);
    if (!superAdmin || superAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Only Super Admin can view admins' },
        { status: 403 }
      );
    }

    // Get all admins
    const admins = await User.find({ role: 'admin' }).select('email name phone role createdAt').sort('-createdAt');

    return NextResponse.json(
      {
        statusCode: 'SUCCESS',
        data: admins,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { statusCode: 'ERROR', message: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}
