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
  Settings,
  Bot
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
import AIAgentTester from './AIAgentTester';

type TabType = 'health-pass' | 'authorities' | 'verification' | 'stats' | 'ai-agent';

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
    },
    {
      id: 'ai-agent' as TabType,
      name: 'AI Agent',
      icon: Bot,
      description: 'Test AI agent integration and MCP tools'
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
      case 'ai-agent':
        return <AIAgentTester />;
      default:
        return <HealthPassManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {!isConnected ? (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
              <div className="text-center">
                {/* Logo */}
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Shield className="w-16 h-16 text-white" />
                </div>
                
                {/* Main Title */}
                <h1 className="text-6xl md:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    VeryFi
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
                  AI-Powered Health Verification
                </p>
                
                {/* Description */}
                <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Secure, private health record verification using zero-knowledge proofs on Midnight blockchain with intelligent AI agents
                </p>
                
                {/* CTA Button */}
                <div className="mb-16">
                  <button
                    onClick={handleConnect}
                    className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl text-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center space-x-3 mx-auto shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Connect Wallet & Start</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Privacy First */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🔐 Privacy First</h3>
                <p className="text-gray-600 leading-relaxed">Your health data remains completely private while proving its validity through zero-knowledge cryptography</p>
              </div>
              
              {/* AI-Powered */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🤖 AI-Powered</h3>
                <p className="text-gray-600 leading-relaxed">Intelligent AI agents handle verification processes seamlessly through natural language interactions</p>
              </div>
              
              {/* Blockchain Verified */}
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">⛓️ Blockchain Verified</h3>
                <p className="text-gray-600 leading-relaxed">Cryptographically verifiable health records secured on Midnight blockchain infrastructure</p>
              </div>
            </div>
            
            {/* Technology Stack */}
            <div className="mt-20 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Powered by Advanced Technology</h2>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Midnight Network</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Zero-Knowledge Proofs</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-medium">AI Agents</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Lisk Blockchain</span>
                </div>
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
