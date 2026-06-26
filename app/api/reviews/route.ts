import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const approved = url.searchParams.get('approved') === 'true';
    const visible = url.searchParams.get('visible') === 'true';
    const all = url.searchParams.get('all') === 'true';

    let query: any = {};
    if (productId) query.product = productId;
    if (approved) query.isApproved = true;
    if (visible && !all) query.isVisible = true;

    const reviews = await Review.find(query)
      .populate('user', 'name email image')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    return createResponse(reviews, 'Reviews fetched successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to fetch reviews', 500, 'SERVER_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const existingReview = await Review.findOne({
      product: body.product,
      user: body.user,
    });

    if (existingReview) {
      return createErrorResponse('You have already reviewed this product', 400, 'DUPLICATE_REVIEW');
    }

    const newReview = new Review({
      ...body,
      isApproved: false,
      isVisible: false,
    });

    await newReview.save();
    await newReview.populate('user', 'name email image');
    await newReview.populate('product', 'name');

    return createResponse(newReview, 'Review created successfully', 201);
  } catch (error: any) {
    return createErrorResponse('Failed to create review', 500, 'SERVER_ERROR');
  }
}
