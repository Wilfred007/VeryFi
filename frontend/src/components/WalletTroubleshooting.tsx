import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink, RefreshCw } from 'lucide-react';

const WalletTroubleshooting: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const troubleshootingSteps = [
    {
      title: "Check MetaMask Installation",
      description: "Make sure MetaMask is installed and enabled in your browser",
      action: "Visit metamask.io to install",
      link: "https://metamask.io/"
    },
    {
      title: "Unlock MetaMask",
      description: "Ensure your MetaMask wallet is unlocked and accessible",
      action: "Click the MetaMask extension and enter your password"
    },
    {
      title: "Add Lisk Sepolia Network",
      description: "The app uses Lisk Sepolia testnet. Add it to MetaMask if not present",
      details: {
        "Network Name": "Lisk Sepolia",
        "RPC URL": "https://rpc.sepolia-api.lisk.com",
        "Chain ID": "4202",
        "Currency Symbol": "ETH",
        "Block Explorer": "https://sepolia-blockscout.lisk.com"
      }
    },
    {
      title: "Refresh and Retry",
      description: "Sometimes a simple refresh resolves connection issues",
      action: "Refresh the page and try connecting again"
    },
    {
      title: "Check Browser Console",
      description: "Look for specific error messages in the browser console",
      action: "Press F12 → Console tab to see detailed errors"
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Wallet Connection Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Wallet Connection Troubleshooting
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {troubleshootingSteps.map((step, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-600 mb-2">{step.description}</p>
                
                {step.action && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-blue-600 font-medium">Action:</span>
                    <span>{step.action}</span>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {step.details && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Network Configuration:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(step.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-mono text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Still Having Issues?</h4>
            <p className="text-yellow-700 text-sm mb-3">
              If you continue to experience connection problems, try these additional steps:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Disable other wallet extensions temporarily</li>
              <li>• Try a different browser or incognito mode</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Restart your browser completely</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTroubleshooting;
