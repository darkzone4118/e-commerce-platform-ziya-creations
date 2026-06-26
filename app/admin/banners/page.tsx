'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Trash2, Plus, Edit2, X, Upload } from 'lucide-react';

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminBanners() {
  const { user, isAdmin } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    displayOrder: 0,
    isActive: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchBanners();
    }
  }, [isAdmin]);

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banners?all=true`);
      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setBanners(data.data || []);
      }
    } catch (error) {
      setError('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, imageUrl: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/banners/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/banners`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setSuccess(editingId ? 'Banner updated successfully' : 'Banner created successfully');
        fetchBanners();
        resetForm();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save banner');
      }
    } catch (error) {
      setError('Failed to save banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner._id);
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
    setImagePreview(banner.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/banners/${bannerId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setSuccess('Banner deleted successfully');
        fetchBanners();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete banner');
      }
    } catch (error) {
      setError('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      displayOrder: 0,
      isActive: true,
    });
    setImagePreview('');
    setUploadMethod('url');
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading banners...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Banners</h1>
        <button
          onClick={() => {
            if (!showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus size={20} />
          Add Banner
        </button>
      </div>

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

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Banner' : 'Add New Banner'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Banner Image</label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`px-4 py-2 rounded ${
                    uploadMethod === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    uploadMethod === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <Upload size={16} />
                  Upload File
                </button>
              </div>

              {uploadMethod === 'url' ? (
                <input
                  type="url"
                  placeholder="Enter image URL"
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}

              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Banner Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {/* Description */}
            <textarea
              placeholder="Banner Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {/* Link */}
            <input
              type="url"
              placeholder="Link (optional)"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {/* Display Order */}
            <input
              type="number"
              placeholder="Display Order"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {/* Active Status */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Active</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700"
              >
                {editingId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-600">
            No banners yet. Create one to get started!
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative h-40 sm:h-48 bg-gray-100 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div
                  className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-semibold ${
                    banner.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {banner.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{banner.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{banner.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
