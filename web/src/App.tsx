import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFleet from './pages/admin/AdminFleet';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPanel from './pages/admin/AdminPanel';
import RoutesPage from './pages/RoutesPage';

import PassengerLayout from './components/PassengerLayout';
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import PassengerBookings from './pages/passenger/PassengerBookings';

import DriverLayout from './components/DriverLayout';
import DriverDashboard from './pages/driver/DriverDashboard';

function RoleRouter() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
  return <Navigate to="/passenger/dashboard" replace />;
}

function Guard({ role, children }: { role: string; children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)', fontSize: 14 }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleRouter />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="fleet" element={<AdminFleet />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="panel" element={<AdminPanel />} />
          </Route>

          <Route path="/passenger" element={<Guard role="passenger"><PassengerLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PassengerDashboard />} />
            <Route path="bookings" element={<PassengerBookings />} />
          </Route>

          <Route path="/driver" element={<Guard role="driver"><DriverLayout /></Guard>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DriverDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
