import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { verifyAuth, createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// GET category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return createErrorResponse('Category not found', 404, 'NOT_FOUND');
    }

    return createResponse(category, 'Category fetched successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to fetch category', 500, 'SERVER_ERROR');
  }
}

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(request);

    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || name.trim() === '') {
      return createErrorResponse('Category name is required', 400, 'VALIDATION_ERROR');
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true }
    );

    if (!category) {
      return createErrorResponse('Category not found', 404, 'NOT_FOUND');
    }

    return createResponse(category, 'Category updated successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to update category', 500, 'SERVER_ERROR');
  }
}

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(request);

    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    await connectDB();

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return createErrorResponse('Category not found', 404, 'NOT_FOUND');
    }

    return createResponse(null, 'Category deleted successfully', 200, 'SUCCESS');
  } catch (error) {
    return createErrorResponse('Failed to delete category', 500, 'SERVER_ERROR');
  }
}
