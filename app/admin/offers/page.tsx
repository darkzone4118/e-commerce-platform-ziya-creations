'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Upload,
  X,
  Clock,
} from 'lucide-react';
import { Offer, OfferInput } from '@/lib/models/Offer';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<OfferInput>({
    title: '',
    description: '',
    discount: 10,
    discountType: 'percentage',
    badge: 'HOT DEAL',
    badgeColor: 'primary',
    isActive: true,
  });

  // Fetch offers
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/offers');
      const data = await res.json();
      if (data.statusCode === 'SUCCESS') {
        setOffers(data.data);
      }
    } catch (error) {
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId ? '/api/offers' : '/api/offers';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.statusCode === 'SUCCESS') {
        await fetchOffers();
        resetForm();
        setShowForm(false);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setFormData({
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      discountType: offer.discountType,
      badge: offer.badge,
      badgeColor: offer.badgeColor,
      image: offer.image,
      expiryDate: offer.expiryDate,
      isActive: offer.isActive,
    });
    setEditingId(offer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const res = await fetch(`/api/offers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.statusCode === 'SUCCESS') {
        await fetchOffers();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to delete offer');
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      const res = await fetch('/api/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          isActive: !offer.isActive,
        }),
      });

      const data = await res.json();
      if (data.statusCode === 'SUCCESS') {
        await fetchOffers();
      }
    } catch (error) {
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          image: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = offers.findIndex((o) => o.id === draggedId);
    const targetIndex = offers.findIndex((o) => o.id === targetId);

    const newOffers = [...offers];
    [newOffers[draggedIndex], newOffers[targetIndex]] = [
      newOffers[targetIndex],
      newOffers[draggedIndex],
    ];

    newOffers.forEach((offer, idx) => {
      offer.order = idx;
    });

    setOffers(newOffers);
    setDraggedId(null);

    // Persist order
    const orderData = newOffers.map(({ id, order }) => ({ id, order }));
    // TODO: Call API to update order
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount: 10,
      discountType: 'percentage',
      badge: 'HOT DEAL',
      badgeColor: 'primary',
      isActive: true,
    });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Offers</h1>
            <p className="mt-2 text-slate-600">
              Create, edit, and manage promotional offers for your store
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Offer
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Offer' : 'Create New Offer'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Offer Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Summer Clearance Sale"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the offer details..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as 'percentage' | 'fixed',
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                {/* Badge */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, badge: e.target.value })
                      }
                      placeholder="e.g., HOT DEAL, FLASH SALE"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Badge Color
                    </label>
                    <select
                      value={formData.badgeColor || 'primary'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          badgeColor: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="primary">Primary (Blue)</option>
                      <option value="secondary">Secondary (Orange)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Yellow)</option>
                      <option value="danger">Danger (Red)</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Offer Image
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    {formData.image ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, image: undefined })
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">
                          Click to upload or drag and drop
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiryDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-900">
                    Active Offer
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Offers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-slate-600 mb-4">No offers yet. Create your first offer!</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Offer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Reorder
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {offers.map((offer) => (
                    <tr
                      key={offer.id}
                      draggable
                      onDragStart={() => handleDragStart(offer.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(offer.id)}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {offer.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {offer.discount}
                          {offer.discountType === 'percentage' ? '%' : '$'} OFF
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {offer.expiryDate
                          ? new Date(offer.expiryDate).toLocaleDateString()
                          : 'No expiry'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(offer)}
                          className="text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          {offer.isActive ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(offer)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
