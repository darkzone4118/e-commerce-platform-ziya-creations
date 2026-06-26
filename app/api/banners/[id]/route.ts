import { connectDB } from '@/lib/db';
import Banner from '@/lib/models/Banner';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();

    const banner = await Banner.findByIdAndUpdate(id, body, { new: true });
    if (!banner) {
      return createErrorResponse('Banner not found', 404, 'NOT_FOUND');
    }

    return createResponse(banner, 'Banner updated successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to update banner', 500, 'SERVER_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return createErrorResponse('Banner not found', 404, 'NOT_FOUND');
    }

    return createResponse(null, 'Banner deleted successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to delete banner', 500, 'SERVER_ERROR');
  }
}
