import { connectDB } from '@/lib/db';
import Store from '@/lib/models/Store';
import { createResponse, createErrorResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    
    const query = all ? {} : { isActive: true };
    const stores = await Store.find(query).sort({ city: 1 });
    return createResponse(stores, 'Stores fetched successfully', 200);
  } catch (error: any) {
    return createErrorResponse('Failed to fetch stores', 500, 'SERVER_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const newStore = new Store(body);
    await newStore.save();

    return createResponse(newStore, 'Store created successfully', 201);
  } catch (error: any) {
    return createErrorResponse('Failed to create store', 500, 'SERVER_ERROR');
  }
}
