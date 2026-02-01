import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Entry from './pages/Entry';
import Triagem from './pages/Triagem';
import Notification from './pages/Notification';
import Pickup from './pages/Pickup';
import Admin from './pages/Admin';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/app-condominio">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/entry" replace />} />
            <Route path="entry" element={<Entry />} />
            <Route path="triagem" element={<Triagem />} />
            <Route path="notification" element={<Notification />} />
            <Route path="pickup" element={<Pickup />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="admin" element={<Admin />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
