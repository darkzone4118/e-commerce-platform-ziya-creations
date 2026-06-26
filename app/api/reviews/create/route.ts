import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { product, order, rating, title, comment, images } = body;

    if (!product || !order || !rating || !title || !comment) {
      return createErrorResponse('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    if (rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Check if review already exists
    const existingReview = await Review.findOne({
      product,
      user: auth.userId,
      order,
    });

    if (existingReview) {
      return createErrorResponse('Review already exists for this product', 409, 'REVIEW_EXISTS');
    }

    const review = new Review({
      product,
      user: auth.userId,
      order,
      rating,
      title,
      comment,
      images: images || [],
      isApproved: true,
    });

    await review.save();

    // Update product rating
    const reviews = await Review.find({ product, isApproved: true });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    return createResponse(review, 'Review created successfully', 201, 'CREATED');
  } catch (error) {
    return createErrorResponse('Failed to create review', 500, 'SERVER_ERROR');
  }
}
