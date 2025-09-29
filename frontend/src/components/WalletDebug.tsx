import React from 'react';
import { useConnect } from 'wagmi';

const WalletDebug: React.FC = () => {
  const { connectors } = useConnect();

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold text-sm mb-2">Debug: Available Connectors</h3>
      <div className="space-y-1">
        {connectors.map((connector) => (
          <div key={connector.id} className="text-xs">
            <span className="font-medium">{connector.name}</span> 
            <span className="text-gray-500"> ({connector.id})</span>
          </div>
        ))}
        {connectors.length === 0 && (
          <div className="text-xs text-red-500">No connectors found!</div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        MetaMask detected: {typeof window !== 'undefined' && window.ethereum ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export default WalletDebug;
