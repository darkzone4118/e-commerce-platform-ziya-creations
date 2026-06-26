import { connectDB } from '@/lib/db';
import Banner from '@/lib/models/Banner';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    
    const query = all ? {} : { isActive: true };
    const banners = await Banner.find(query).sort({ displayOrder: 1 });
    return createResponse(banners,'Banners fetched successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to fetch banners', 500, 'SERVER_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const newBanner = new Banner(body);
    await newBanner.save();

    return createResponse('Banner created successfully', newBanner, 201);
  } catch (error: any) {
    return createErrorResponse('Failed to create banner', 500, 'SERVER_ERROR');
  }
}
