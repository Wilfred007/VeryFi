import React, { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { 
  Shield, 
  Users, 
  FileCheck, 
  Activity,
  Plus,
  Search,
  Bell,
  Settings
} from 'lucide-react';
// import Header from './Header';
// import HealthPassManager from './HealthPassManager';
// import AuthorityManager from './AuthorityManager';
// import ProofVerifier from './ProofVerifier';
// import SystemStats from './SystemStats';
import HealthPassManager from './HealthPassManager';
import AuthorityManager from './AuthorityManager';
import ProofVerifier from './ProofVerifier';
import Header from './Header';
import SystemStats from './SystemStats';

type TabType = 'health-pass' | 'authorities' | 'verification' | 'stats';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('health-pass');
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    const injectedConnector = connectors.find(connector => connector.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const tabs = [
    {
      id: 'health-pass' as TabType,
      name: 'Health Pass',
      icon: Shield,
      description: 'Manage your health records and ZK proofs'
    },
    {
      id: 'authorities' as TabType,
      name: 'Authorities',
      icon: Users,
      description: 'Health authority registration and management'
    },
    {
      id: 'verification' as TabType,
      name: 'Verification',
      icon: FileCheck,
      description: 'Verify ZK proofs and health records'
    },
    {
      id: 'stats' as TabType,
      name: 'Statistics',
      icon: Activity,
      description: 'System statistics and analytics'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'health-pass':
        return <HealthPassManager />;
      case 'authorities':
        return <AuthorityManager />;
      case 'verification':
        return <ProofVerifier />;
      case 'stats':
        return <SystemStats />;
      default:
        return <HealthPassManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ZK Health Pass
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Secure, private health record verification using zero-knowledge proofs on Lisk blockchain
            </p>
            <div className="mb-6">
              <button
                onClick={handleConnect}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>Connect Wallet</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-health-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-health-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
                <p className="text-gray-600">Your health data remains private while proving its validity</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FileCheck className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifiable</h3>
                <p className="text-gray-600">Cryptographically verifiable health records</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted</h3>
                <p className="text-gray-600">Issued by verified health authorities</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`mr-2 h-5 w-5 ${
                        activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="mt-4">
              <p className="text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
