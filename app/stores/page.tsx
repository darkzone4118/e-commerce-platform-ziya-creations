'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

interface Store {
  _id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stores`);
      const data = await response.json();
      if (data.statusCode === 'SUCCESS') {
        setStores(data.data || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const cities = [...new Set(stores.map(store => store.city))];
  const filteredStores = selectedCity ? stores.filter(store => store.city === selectedCity) : stores;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Store Locator</h1>
          <p className="text-lg text-blue-100">Find Ziya stores near you</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stores...</p>
          </div>
        ) : (
          <>
            {/* City Filter */}
            {cities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Filter by City</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedCity('')}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      selectedCity === ''
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-primary'
                    }`}
                  >
                    All Cities
                  </button>
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        selectedCity === city
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stores Grid */}
            {filteredStores.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No stores found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map(store => (
                  <div key={store._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                      <h3 className="text-2xl font-bold mb-2">{store.name}</h3>
                      <p className="text-blue-100">{store.city}, {store.state}</p>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex gap-3">
                        <MapPin size={20} className="text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Address</p>
                          <p className="text-gray-600 text-sm">{store.address}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Phone size={20} className="text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Phone</p>
                          <a href={`tel:${store.phone}`} className="text-primary text-sm hover:underline">
                            {store.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Mail size={20} className="text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Email</p>
                          <a href={`mailto:${store.email}`} className="text-primary text-sm hover:underline">
                            {store.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Clock size={20} className="text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Hours</p>
                          <p className="text-gray-600 text-sm">
                            {store.openingTime} - {store.closingTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
