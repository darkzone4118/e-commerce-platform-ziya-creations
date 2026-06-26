import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug');

    if (!product) {
      return createErrorResponse('Product not found', 404, 'NOT_FOUND');
    }

    // Get approved reviews
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(10)
      .lean();

    return createResponse(
      { product, reviews },
      'Product fetched successfully',
      200,
      'SUCCESS'
    );
  } catch (error) {
    return createErrorResponse('Failed to fetch product', 500, 'SERVER_ERROR');
  }
}
