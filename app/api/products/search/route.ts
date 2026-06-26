import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length === 0) {
      return createErrorResponse('Search query required', 400, 'INVALID_INPUT');
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('category', 'name slug')
      .limit(limit)
      .lean();

    return createResponse(
      { products, count: products.length },
      'Search completed',
      200,
      'SUCCESS'
    );
  } catch (error) {
    return createErrorResponse('Search failed', 500, 'SERVER_ERROR');
  }
}
