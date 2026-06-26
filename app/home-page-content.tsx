"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { useAuth } from "./context/AuthContext";
import OfferCarousel from "./components/OfferCarousel";
import ReviewsSection from "./components/ReviewsSection";
import { useTouchScroll } from "./hooks/useTouchScroll";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Heart,
  Phone,
  Mail,
  ChevronRight,
  Star,
  ChevronLeft,
  Home,
  Package,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: Category;
  rating: number;
  reviewCount: number;
  stock: number;
  totalSold: number;
  gender: string;
}

interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

export default function HomePageContent() {
  const searchParams = useSearchParams();
  const productsRef = useRef<HTMLElement>(null);
  const bestSellersScrollRef = useTouchScroll();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bestSellerIndex, setBestSellerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, logout } = useAuth();
  const { items: cart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const bannerTimer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, [banners.length]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("#mobile-menu") &&
        !target.closest("button[aria-label='Toggle mobile menu']")
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes, bestSellersRes, bannersRes, offersRes, wishlistRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=12`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sort=totalSold&limit=8`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/banners`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`).catch(() => ({ json: async () => ({ data: [] }) })),
      ]);

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      const bestSellersData = await bestSellersRes.json();
      const bannersData = await bannersRes.json();
      const offersData = await offersRes.json();
      const wishlistData = await wishlistRes.json();

      if (categoriesData.statusCode === "SUCCESS") {
        setCategories(categoriesData.data);
      }
      if (productsData.statusCode === "SUCCESS") {
        setProducts(productsData.data);
      }
      if (bestSellersData.statusCode === "SUCCESS") {
        setBestSellers(bestSellersData.data);
      }
      if (bannersData.statusCode === "SUCCESS") {
        setBanners(bannersData.data);
      }
      if (offersData.statusCode === "SUCCESS") {
        setOffers(offersData.data);
      }
      if (wishlistData.data) {
        setWishlist(new Set(wishlistData.data));
      }
    } catch (error) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category._id !== selectedCategory) return false;
    if (selectedGender && p.gender !== selectedGender) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Home className="w-6 h-6 text-blue-600" />
              <span className="text-lg md:text-xl font-bold text-blue-600 hidden sm:inline">
                Ziya Creations
              </span>
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md mx-4 items-center bg-gray-100 rounded-lg overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {/* Cart */}
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-lg relative">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative group">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <User className="w-5 h-5 text-gray-700" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg hidden group-hover:block z-50">
                  {user ? (
                    <>
                      <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Profile
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        My Orders
                      </Link>
                      <Link href="/wishlist" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Wishlist
                      </Link>
                      {user.role === "super_admin" || user.role === "admin" ? (
                        <Link href="/admin" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                          Admin Panel
                        </Link>
                      ) : null}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Login
                      </Link>
                      <Link href="/auth/signup" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {searchOpen && (
            <form
              onSubmit={handleSearch}
              className="md:hidden mt-3 flex items-center bg-gray-100 rounded-lg overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mobile Menu Items */}
          {mobileMenuOpen && (
            <div
              id="mobile-menu"
              className="md:hidden mt-3 space-y-2 pb-3 border-t pt-3"
            >
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Offer Carousel */}
      {offers.length > 0 && <OfferCarousel offers={offers} />}

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative h-64 md:h-80 bg-white overflow-hidden rounded-lg mx-2 md:mx-4 mt-4">
          <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
            {banners[currentBannerIndex]?.imageUrl ? (
              <img
                src={banners[currentBannerIndex].imageUrl}
                alt={banners[currentBannerIndex].title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-500">No image available</div>
            )}
          </div>

          {/* Banner Navigation */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentBannerIndex(
                    (prev) => (prev - 1 + banners.length) % banners.length
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentBannerIndex
                        ? "bg-blue-600 w-6"
                        : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Category Filter Section */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <h3 className="font-semibold text-sm md:text-base mb-3">Categories</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => handleCategoryChange("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === ""
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(cat._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat._id
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <h3 className="font-semibold text-sm md:text-base mb-3">Gender</h3>
            <div className="space-y-2">
              {["Men", "Women", "Unisex"].map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleGenderChange(selectedGender === gender ? "" : gender)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedGender === gender
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Products */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 md:p-6">
            <h3 className="font-semibold text-base md:text-lg mb-2">
              Featured Collection
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Discover our best-selling items and new arrivals
            </p>
            <Link
              href="/products"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Best Sellers</h2>
          <Link href="/products" className="text-blue-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div
            ref={bestSellersScrollRef.ref as any}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-2"
          >
            {bestSellers.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug}`}
                className="flex-shrink-0 w-40 md:w-48 group cursor-pointer"
              >
                <div className="bg-gray-200 rounded-lg overflow-hidden h-40 md:h-48 mb-2 relative">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle wishlist
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlist.has(product._id)
                          ? "fill-red-600 text-red-600"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">
                    {product.rating || 0} ({product.reviewCount || 0})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">₹{product.discountedPrice || product.price}</span>
                  {product.discountedPrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{product.price}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section ref={productsRef} className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Featured Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {(filteredProducts.length > 0 ? filteredProducts : products).map(
            (product) => (
              <Link
                key={product._id}
                href={`/products/${product.slug}`}
                className="group cursor-pointer"
              >
                <div className="bg-gray-200 rounded-lg overflow-hidden h-32 md:h-48 mb-2 relative">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle wishlist
                    }}
                    className="absolute top-1 md:top-2 right-1 md:right-2 p-1.5 md:p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  >
                    <Heart
                      className={`w-3 h-3 md:w-4 md:h-4 ${
                        wishlist.has(product._id)
                          ? "fill-red-600 text-red-600"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
                <h3 className="font-semibold text-xs md:text-sm line-clamp-2 group-hover:text-blue-600">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">
                    {product.rating || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs md:text-sm">
                    ₹{product.discountedPrice || product.price}
                  </span>
                  {product.discountedPrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{product.price}
                    </span>
                  )}
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3">About</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 1234567890</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@ziyacreations.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 md:pt-8 text-center text-xs md:text-sm">
            <p>&copy; 2026 Ziya Creations. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
