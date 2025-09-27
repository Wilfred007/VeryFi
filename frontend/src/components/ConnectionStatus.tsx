import React, { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const { error } = useConnect();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Show status when there are connection issues
    if (error || isConnecting || isReconnecting) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, isConnecting, isReconnecting]);

  if (!showStatus && isConnected) return null;

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        message: 'Connection failed. Please check MetaMask and try again.',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500'
      };
    }
    
    if (isConnecting || isReconnecting) {
      return {
        icon: <Wifi className="w-4 h-4 animate-pulse" />,
        message: 'Connecting to wallet...',
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500'
      };
    }
    
    if (isConnected) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        message: 'Wallet connected successfully',
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500'
      };
    }
    
    return {
      icon: <WifiOff className="w-4 h-4" />,
      message: 'No wallet connected',
      bgColor: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-500'
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`fixed top-20 right-4 z-50 p-3 rounded-lg border ${status.bgColor} ${status.textColor} shadow-lg max-w-sm`}>
      <div className="flex items-center space-x-2">
        <div className={status.iconColor}>
          {status.icon}
        </div>
        <span className="text-sm font-medium">{status.message}</span>
        <button
          onClick={() => setShowStatus(false)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-600">
          <details>
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
