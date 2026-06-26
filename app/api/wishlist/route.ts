import { connectDB } from '@/lib/db';
import Wishlist from '@/lib/models/Wishlist';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Invalid token' },
        { status: 401 }
      );
    }

    let wishlist = await Wishlist.findOne({ userId: decoded.userId }).populate('products');
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId: decoded.userId, products: [] });
      await wishlist.save();
    }

    return NextResponse.json({
      statusCode: 'SUCCESS',
      message: 'Wishlist fetched',
      data: wishlist,
    });
  } catch (error: any) {
    return NextResponse.json(
      { statusCode: 'ERROR', message: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId } = await req.json();
    const token = req.headers.get('authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { statusCode: 'ERROR', message: 'Invalid token' },
        { status: 401 }
      );
    }

    let wishlist = await Wishlist.findOne({ userId: decoded.userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId: decoded.userId, products: [productId] });
      await wishlist.save();
    } else {
      if (wishlist.products.includes(productId)) {
        wishlist.products = wishlist.products.filter((id: any) => id.toString() !== productId);
      } else {
        wishlist.products.push(productId);
      }
      await wishlist.save();
    }

    return NextResponse.json({
      statusCode: 'SUCCESS',
      message: 'Wishlist updated',
      data: wishlist,
    });
  } catch (error: any) {
    return NextResponse.json(
      { statusCode: 'ERROR', message: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}
