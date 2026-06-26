import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { amount, orderId, userEmail, userName } = await request.json();

    if (!amount || !orderId) {
      return NextResponse.json(
        { statusCode: 'FAILED', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Razorpay here to avoid issues with missing env vars at build time
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'key_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
    });

    const options = {
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: {
        orderId,
        userEmail,
        userName,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(
      {
        statusCode: 'SUCCESS',
        message: 'Razorpay order created',
        data: order,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 'FAILED',
        message: error.message || 'Failed to create Razorpay order',
      },
      { status: 500 }
    );
  }
}
