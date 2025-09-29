import React from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { Shield, ExternalLink, Wallet } from 'lucide-react';
import { LISK_SEPOLIA } from '../config/contracts';

const Header: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: LISK_SEPOLIA.id,
  });

  const handleConnect = () => {
    // Try MetaMask first, then injected, then any available connector
    const metaMaskConnector = connectors.find(connector => 
      connector.id === 'metaMask' || connector.name.toLowerCase().includes('metamask')
    );
    const injectedConnector = connectors.find(connector => connector.id === 'injected');
    const availableConnector = metaMaskConnector || injectedConnector || connectors[0];
    
    if (availableConnector) {
      console.log('Connecting with:', availableConnector.name, availableConnector.id);
      connect({ connector: availableConnector });
    } else {
      alert('No wallet connectors available. Please install MetaMask.');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  VeryFi
                </h1>
                <p className="text-xs text-gray-500 font-medium">Powered by Midnight & AI</p>
              </div>
            </div>
          </div>

          {/* Network Info and Wallet */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                {/* Network Status */}
                <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 font-medium">Lisk Sepolia</span>
                </div>

                {/* Balance */}
                {balance && (
                  <div className="hidden md:flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </span>
                  </div>
                )}

                {/* Faucet Link */}
                <a
                  href="https://faucet.sepolia-api.lisk.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <span>Get Test ETH</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}

            {/* Connect Wallet Button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
