'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Grid3X3, ShoppingCart, Tag, Users, Settings, LogOut, Menu, X, Crown, Image, MapPin, Gift, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', roles: ['super_admin', 'admin'] },
    { icon: Package, label: 'Products', href: '/admin/products', roles: ['super_admin', 'admin'] },
    { icon: Grid3X3, label: 'Categories', href: '/admin/categories', roles: ['super_admin', 'admin'] },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', roles: ['super_admin', 'admin'] },
    { icon: Tag, label: 'Coupons', href: '/admin/coupons', roles: ['super_admin', 'admin'] },
    { icon: Gift, label: 'Offers', href: '/admin/offers', roles: ['super_admin'] },
    { icon: MessageSquare, label: 'Reviews', href: '/admin/reviews', roles: ['super_admin'] },
    { icon: Image, label: 'Banners', href: '/admin/banners', roles: ['super_admin'] },
    { icon: MapPin, label: 'Stores', href: '/admin/stores', roles: ['super_admin'] },
    { icon: Users, label: 'Manage Admins', href: '/admin/manage-admins', roles: ['super_admin'] },
    { icon: Settings, label: 'Settings', href: '/admin/settings', roles: ['super_admin', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'customer'));
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-screen bg-white border-r border-gray-200 w-72 md:w-64 z-40 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-primary to-blue-600 flex-shrink-0">
            {/* Close button on mobile */}
            <div className="flex md:hidden justify-end mb-3">
              <button onClick={() => setIsOpen(false)} className="text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-sm md:text-base">{user?.name}</p>
                <p className="text-blue-100 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            {user?.role === 'super_admin' && (
              <div className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                <Crown size={12} />
                SUPER ADMIN
              </div>
            )}
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 bg-secondary text-white px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                <Users size={12} />
                ADMIN
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-3 md:py-4">
            <div className="space-y-1 px-2 md:px-3">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base ${
                      active
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout Section */}
          <div className="p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all text-sm md:text-base"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
