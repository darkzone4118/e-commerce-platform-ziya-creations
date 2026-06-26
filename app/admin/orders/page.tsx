'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ChevronLeft, ChevronRight, Eye, Download, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderId: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  address: any;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminOrders() {
  const { user, loading, isAdmin, authToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [paginationData, setPaginationData] = useState<PaginationData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/auth/login');
    }
  }, [user, loading, isAdmin, router]);

  const fetchOrders = async (page: number) => {
    try {
      setPageLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders?page=${page}&limit=10&status=${selectedOrderStatus}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.statusCode === 'SUCCESS' && data.data) {
        let filteredOrders = data.data.orders;

        // Apply search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          filteredOrders = filteredOrders.filter(
            (order: Order) =>
              order.orderId.toLowerCase().includes(term) ||
              order.user.name.toLowerCase().includes(term) ||
              order.user.email.toLowerCase().includes(term)
          );
        }

        setOrders(filteredOrders);
        setPaginationData(data.data.pagination);
      }
    } catch (error) {
      console.error('[v0] Fetch orders error:', error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchOrders(currentPage);
    }
  }, [authToken, currentPage, selectedOrderStatus]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            orderId,
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.statusCode === 'SUCCESS') {
        // Update local state
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, orderStatus: newStatus } : order
          )
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
      }
    } catch (error) {
      console.error('[v0] Update order error:', error);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleExportCSV = () => {
    if (!orders.length) return;

    const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Payment Status', 'Order Status', 'Date'];
    const csvData = orders.map((order) => [
      order.orderId,
      order.user.name,
      order.user.email,
      order.total,
      order.paymentStatus,
      order.orderStatus,
      new Date(order.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-gray-600 mt-1">View and manage all customer orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search by Order ID, Name, or Email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 outline-none text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <Filter size={18} className="text-gray-500" />
              <select
                value={selectedOrderStatus}
                onChange={(e) => {
                  setSelectedOrderStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 outline-none text-sm"
              >
                <option value="all">All Orders</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {pageLoading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{order.orderId}</td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{order.user.name}</p>
                            <p className="text-gray-600 text-xs">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} item(s)</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.paymentStatus === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`px-3 py-1 rounded text-xs font-medium border ${
                              order.orderStatus === 'delivered'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : order.orderStatus === 'confirmed'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : order.orderStatus === 'shipped'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationData && paginationData.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Page {paginationData.page} of {paginationData.pages} ({paginationData.total} total orders)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(paginationData.pages, currentPage + 1))
                      }
                      disabled={currentPage === paginationData.pages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Order ID</p>
                  <p className="text-lg font-bold text-blue-600">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Order Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                    <p className="text-gray-900">{selectedOrder.user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                    <p className="text-gray-900">{selectedOrder.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                    <p className="text-gray-900">{selectedOrder.user.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Delivery Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedOrder.address.name}</p>
                  <p className="text-gray-600 text-sm mt-1">{selectedOrder.address.street}</p>
                  <p className="text-gray-600 text-sm">
                    {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {item.product.images && item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">N/A</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-semibold text-gray-900 mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-blue-600">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Update Order Status</label>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => {
                    handleStatusChange(selectedOrder._id, e.target.value);
                    setShowOrderDetails(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
