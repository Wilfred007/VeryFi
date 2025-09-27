import React from 'react';
import { useReadContract } from 'wagmi';
import { 
  Activity, 
  Users, 
  Shield, 
  FileCheck, 
  TrendingUp,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { ZK_HEALTH_PASS_REGISTRY_ABI, HEALTH_AUTHORITY_REGISTRY_ABI } from '../config/abis';

const SystemStats: React.FC = () => {
  // Read system stats from contracts - temporarily commented out due to wagmi v2 API changes
  // const { data: systemStats } = useReadContract({
  //   address: CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY,
  //   abi: ZK_HEALTH_PASS_REGISTRY_ABI,
  //   functionName: 'getSystemStats',
  // });

  // const { data: registryStats } = useReadContract({
  //   address: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
  //   abi: HEALTH_AUTHORITY_REGISTRY_ABI,
  //   functionName: 'getRegistryStats',
  // });

  // Placeholder for contract data
  const systemStats: any = null;
  const registryStats: any = null;

  // Mock data for demonstration
  const mockStats = {
    totalAuthorities: 25,
    activeAuthorities: 22,
    pendingAuthorities: 2,
    suspendedAuthorities: 1,
    revokedAuthorities: 0,
    totalProofs: 1247,
    totalVerifications: 3891,
    proofsToday: 45,
    verificationsToday: 128,
    averageVerificationsPerProof: 3.1,
    networkUptime: 99.8,
    lastBlockTime: Date.now() - 12000, // 12 seconds ago
  };

  const recentActivity = [
    {
      type: 'proof_submitted',
      timestamp: Date.now() - 300000, // 5 minutes ago
      description: 'New health proof submitted',
      authority: 'City General Hospital',
      hash: '0x1234...5678'
    },
    {
      type: 'proof_verified',
      timestamp: Date.now() - 600000, // 10 minutes ago
      description: 'Proof verified at Airport Security',
      verifier: '0xabcd...efgh',
      hash: '0x9876...5432'
    },
    {
      type: 'authority_registered',
      timestamp: Date.now() - 1800000, // 30 minutes ago
      description: 'New health authority registered',
      authority: 'Regional Medical Center',
      address: '0xdef0...1234'
    },
    {
      type: 'proof_verified',
      timestamp: Date.now() - 2400000, // 40 minutes ago
      description: 'Proof verified at Hospital Entry',
      verifier: '0x5678...9abc',
      hash: '0xfedc...ba98'
    }
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proof_submitted':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'proof_verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'authority_registered':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'proof_submitted':
        return 'bg-blue-50 border-blue-200';
      case 'proof_verified':
        return 'bg-green-50 border-green-200';
      case 'authority_registered':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>
        <p className="text-gray-600 mt-1">Real-time analytics and system health metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Authorities</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[0]?.toString() : formatNumber(mockStats.totalAuthorities)}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 this week
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Proofs</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemStats ? systemStats[1]?.toString() : formatNumber(mockStats.totalProofs)}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{mockStats.proofsToday} today
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Verifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemStats ? systemStats[2]?.toString() : formatNumber(mockStats.totalVerifications)}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{mockStats.verificationsToday} today
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Network Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.networkUptime}%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Healthy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authority Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Authority Status</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Active</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {registryStats ? registryStats[1]?.toString() : mockStats.activeAuthorities}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {registryStats ? registryStats[2]?.toString() : mockStats.pendingAuthorities}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Suspended</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {registryStats ? registryStats[3]?.toString() : mockStats.suspendedAuthorities}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Revoked</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {registryStats ? registryStats[4]?.toString() : mockStats.revokedAuthorities}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Avg. Verifications per Proof</span>
              <span className="text-sm font-medium text-gray-900">{mockStats.averageVerificationsPerProof}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Proofs Today</span>
              <span className="text-sm font-medium text-gray-900">{mockStats.proofsToday}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Verifications Today</span>
              <span className="text-sm font-medium text-gray-900">{mockStats.verificationsToday}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Last Block</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(mockStats.lastBlockTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Globe className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Network Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Network</h4>
            <p className="text-sm text-gray-900">Lisk Sepolia Testnet</p>
            <p className="text-xs text-gray-500">Chain ID: 4202</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">RPC Endpoint</h4>
            <p className="text-sm text-gray-900 font-mono">rpc.sepolia-api.lisk.com</p>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-green-600">Connected</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Explorer</h4>
            <a 
              href="https://sepolia-blockscout.lisk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              sepolia-blockscout.lisk.com
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                      {activity.authority && <span>Authority: {activity.authority}</span>}
                      {activity.verifier && <span>Verifier: {activity.verifier}</span>}
                      {activity.address && <span>Address: {activity.address}</span>}
                      {activity.hash && <span>Hash: {activity.hash}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="card">
        <div className="flex items-center mb-4">
          <FileCheck className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Deployed Contracts</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Health Authority Registry</p>
              <p className="text-xs text-gray-500">Manages health authority registrations</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-gray-600">{CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY}</p>
              <a 
                href={`https://sepolia-blockscout.lisk.com/address/${CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View on Explorer
              </a>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">ZK Health Pass Registry</p>
              <p className="text-xs text-gray-500">Manages ZK proofs and verifications</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-gray-600">{CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY}</p>
              <a 
                href={`https://sepolia-blockscout.lisk.com/address/${CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View on Explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStats;
