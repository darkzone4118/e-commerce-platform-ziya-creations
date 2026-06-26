import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const { name, description, image } = body;

    if (!name) {
      return createErrorResponse('Category name is required', 400, 'VALIDATION_ERROR');
    }

    await connectDB();

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: name, $options: 'i' },
    });

    if (existingCategory) {
      return createErrorResponse('Category already exists', 409, 'CATEGORY_EXISTS');
    }

    // Create slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const category = new Category({
      name,
      slug,
      description,
      image: image || null,
      isActive: true,
    });

    await category.save();

    return createResponse(category, 'Category created successfully', 201, 'CREATED');
  } catch (error) {
    return createErrorResponse('Failed to create category', 500, 'SERVER_ERROR');
  }
}
