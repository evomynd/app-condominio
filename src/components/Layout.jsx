import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Package, Bell, PackageCheck, Settings, LogOut, Users, BarChart3, FileText, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { setupAutoSync } from '../utils/sync';
import ConnectionStatus from './ConnectionStatus';

const Layout = () => {
  const { signOut, user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setupAutoSync();
  }, []);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      navigate('/login');
    }
  };

  // Itens de navegação do rodapé (máximo 4)
  const footerNavItems = [
    { to: '/entry', icon: Package, label: 'Entrada', roles: ['admin', 'porteiro', 'controlador', 'expedicao'] },
    { to: '/triagem', icon: ClipboardList, label: 'Triagem', roles: ['admin', 'porteiro', 'controlador', 'expedicao'] },
    { to: '/notification', icon: Bell, label: 'Notificar', roles: ['admin', 'porteiro', 'controlador', 'expedicao'] },
    { to: '/pickup', icon: PackageCheck, label: 'Retirada', roles: ['admin', 'porteiro', 'controlador', 'expedicao'] }
  ];

  const visibleFooterItems = footerNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <ConnectionStatus />

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Admin Menu (apenas para admin) */}
            {userRole === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-700'
                  }`
                }
                title="Admin"
              >
                <Settings size={20} />
              </NavLink>
            )}
            
            <h1 className="text-xl font-bold">Gestão de Encomendas</h1>
          </div>
          
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
        {user && (
          <p className="text-sm text-blue-100 mt-1">{user.email}</p>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {visibleFooterItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;


