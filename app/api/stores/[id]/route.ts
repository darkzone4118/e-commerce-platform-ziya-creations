import { connectDB } from '@/lib/db';
import Store from '@/lib/models/Store';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();

    const store = await Store.findByIdAndUpdate(id, body, { new: true });
    if (!store) {
      return createErrorResponse('Store not found', 404, 'NOT_FOUND');
    }

    return createResponse(store, 'Store updated successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to update store', 500, 'SERVER_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return createErrorResponse('Store not found', 404, 'NOT_FOUND');
    }

    return createResponse(null, 'Store deleted successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to delete store', 500, 'SERVER_ERROR');
  }
}
