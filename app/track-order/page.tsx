'use client';

import { useState } from 'react';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${trackingId}`);
      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setOrder(data.data);
      } else {
        setError('Order not found. Please check your tracking ID.');
      }
    } catch (error) {
      setError('Error tracking order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={24} className="text-yellow-500" />;
      case 'processing':
        return <Package size={24} className="text-blue-500" />;
      case 'shipped':
        return <Truck size={24} className="text-purple-500" />;
      case 'delivered':
        return <CheckCircle size={24} className="text-green-500" />;
      default:
        return <Package size={24} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
          <p className="text-lg text-blue-100">Enter your order ID to track your shipment</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-900 mb-2">Order ID</label>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your order ID (e.g., ORD-123456)"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-3 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-8">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Status</h2>

              <div className="space-y-6">
                {/* Status Timeline */}
                <div className="space-y-4">
                  {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                    const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                    const isCurrent = order.status === status;

                    return (
                      <div key={status} className="flex items-center gap-4">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? isCurrent
                                ? 'bg-secondary text-white'
                                : 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {getStatusLabel(status)}
                          </h3>
                          {isCurrent && <p className="text-sm text-primary">Current Status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold text-gray-900">{order._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">₹{order.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
                      <p className="font-semibold text-gray-900">{order.shippingAddress?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Items in Order</h3>
                  <div className="space-y-3">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="text-center py-8">
        <Link href="/" className="text-primary hover:underline font-semibold">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
