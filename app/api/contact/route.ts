import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // For now, we'll just return success


    return NextResponse.json({
      statusCode: 'SUCCESS',
      message: 'Message received successfully. We will get back to you soon!',
      data: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { statusCode: 'ERROR', message: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
