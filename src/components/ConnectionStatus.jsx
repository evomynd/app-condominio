import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-3 shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={20} />
        <span className="font-semibold">Modo Offline</span>
        <span className="text-sm">- As alterações serão sincronizadas quando a conexão voltar</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
