import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// CSS Imports (in exact required order)
import './css/base.css';
import './css/animations.css';
import './css/layout.css';
import './css/components.css';
import './css/pages.css';

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

// Centered fallback loading spinner
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      backgroundColor: 'var(--color-bg, #080808)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--color-border, #1a1a1a)',
        borderTop: '3px solid var(--color-accent, #ff4e50)',
        borderRadius: '50%',
        animation: 'button-spin 1s linear infinite'
      }}></div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <main>
            <Suspense fallback={<PageLoader />}>
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
          </main>
          <MobileBottomNav />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
