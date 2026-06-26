import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();

    const review = await Review.findByIdAndUpdate(id, body, { new: true })
      .populate('user', 'name email image')
      .populate('product', 'name');

    if (!review) {
      return createErrorResponse('Review not found', 404, 'NOT_FOUND');
    }

    return createResponse(review, 'Review updated successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to update review', 500, 'SERVER_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return createErrorResponse('Review not found', 404, 'NOT_FOUND');
    }

    return createResponse(null, 'Review deleted successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to delete review', 500, 'SERVER_ERROR');
  }
}
