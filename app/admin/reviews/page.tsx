'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Trash2, Eye, EyeOff, Check, X } from 'lucide-react';

interface Review {
  _id: string;
  product: { name: string };
  user: { name: string; email: string };
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
}

export default function AdminReviews() {
  const { user, isSuperAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (isSuperAdmin) {
      fetchReviews();
    }
  }, [isSuperAdmin, filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = filter === 'approved' 
        ? '/api/reviews?all=true&approved=true'
        : filter === 'pending'
        ? '/api/reviews?all=true'
        : '/api/reviews?all=true';

      const response = await fetch(url);
      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        const filteredReviews = filter === 'pending' 
          ? data.data.filter((r: Review) => !r.isApproved)
          : data.data;
        setReviews(filteredReviews);
      }
    } catch (error) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ isApproved: true }),
      });

      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setSuccess('Review approved successfully');
        fetchReviews();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to approve review');
    }
  };

  const handleToggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });

      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setSuccess(!currentVisibility ? 'Review is now visible' : 'Review is now hidden');
        fetchReviews();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to toggle visibility');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setSuccess('Review deleted successfully');
        fetchReviews();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to delete review');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading reviews...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Manage Reviews</h1>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Approved
        </button>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Comment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{review.product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{review.user.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {review.title}: {review.comment.substring(0, 30)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          review.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </div>
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          review.isVisible
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {review.isVisible ? 'Visible' : 'Hidden'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm space-y-2">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review._id)}
                        className="block w-full bg-green-600 text-white px-3 py-2 rounded text-xs font-semibold hover:bg-green-700"
                      >
                        <Check size={14} className="inline mr-1" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleVisibility(review._id, review.isVisible)}
                      className={`block w-full px-3 py-2 rounded text-xs font-semibold ${
                        review.isVisible
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {review.isVisible ? (
                        <>
                          <EyeOff size={14} className="inline mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye size={14} className="inline mr-1" />
                          Show
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="block w-full bg-red-600 text-white px-3 py-2 rounded text-xs font-semibold hover:bg-red-700"
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
