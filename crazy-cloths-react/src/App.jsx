import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// CSS Imports (in exact required order)
import './css/base.css';
import './css/animations.css';
import './css/layout.css';
import './css/components.css';
import './css/pages.css';
import './css/auth.css';
import './css/mobile-nav.css';

// Lazy Loaded Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/login';
  const hideMainLayout = isAdminPage || isLoginPage;

  return (
    <>
      {!hideMainLayout && <Header />}
      {!hideMainLayout && <MobileBottomNav />}
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/product/:id" element={<ProductPage />} />

          {/* Customer Private Routes */}
          <Route 
            path="/wishlist" 
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <SuccessPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Dashboard Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminProducts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
      {!hideMainLayout && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
