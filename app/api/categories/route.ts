import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Get all active categories
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    return createResponse(categories, 'Categories fetched successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to fetch categories', 500, 'SERVER_ERROR');
  }
}

// Create new category
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === '') {
      return createErrorResponse('Category name is required', 400, 'VALIDATION_ERROR');
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Check if category already exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      return createErrorResponse('Category already exists', 400, 'DUPLICATE_ERROR');
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      isActive: true,
    });

    return createResponse(category, 'Category created successfully', 201, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to create category', 500, 'SERVER_ERROR');
  }
}
