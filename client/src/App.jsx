import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductAddPage from './pages/ProductAddPage';
import ProductEditPage from './pages/ProductEditPage';
import Services from './pages/Services';
import ServiceAddPage from './pages/ServiceAddPage';
import Documents from './pages/Documents';
import CalendarPage from './pages/CalendarPage';
import ExpiringWarrantiesPage from './pages/ExpiringWarrantiesPage';
import WarrantyHistoryPage from './pages/WarrantyHistoryPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import WarrantyDetailsPage from './pages/WarrantyDetailsPage';
import SupportPage from './pages/SupportPage';
import AboutPage from './pages/AboutPage';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import PublicHome from './pages/PublicHome';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Auth mode="register" />} />

      <Route path="/" element={user ? <ProtectedRoute><Layout /></ProtectedRoute> : <PublicHome />}>
        <Route index element={<Dashboard />} />
      </Route>

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<ProductAddPage />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/edit" element={<ProductEditPage />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/add" element={<ServiceAddPage />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/warranties/expiring" element={<ExpiringWarrantiesPage />} />
        <Route path="/warranties/history" element={<WarrantyHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/warranties/:id" element={<WarrantyDetailsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
