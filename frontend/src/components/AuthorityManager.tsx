import React, { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Users, 
  Building, 
  CheckCircle, 
  Clock,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { CONTRACT_ADDRESSES, AuthorityType, AuthorityStatus, AUTHORITY_TYPE_LABELS, AUTHORITY_STATUS_LABELS } from '../config/contracts';
import { HEALTH_AUTHORITY_REGISTRY_ABI } from '../config/abis';

interface Authority {
  address: string;
  name: string;
  authorityType: AuthorityType;
  country: string;
  region: string;
  publicKey: string;
  certificateHash: string;
  contactInfo: string;
  status: AuthorityStatus;
  registeredAt: number;
  totalRecordsIssued: number;
  totalRecordsRevoked: number;
}

const AuthorityManager: React.FC = () => {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all');
  const { address } = useAccount();
  
  const { writeContract, isPending } = useWriteContract();

  // Read registry stats - temporarily commented out due to wagmi v2 API changes
  // const { data: registryStats } = useReadContract({
  //   address: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
  //   abi: HEALTH_AUTHORITY_REGISTRY_ABI,
  //   functionName: 'getRegistryStats',
  // });

  // // Read all authorities
  // const { data: allAuthorities } = useReadContract({
  //   address: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
  //   abi: HEALTH_AUTHORITY_REGISTRY_ABI,
  //   functionName: 'getAllAuthorities',
  // });

  // // Read pending applications
  // const { data: pendingApplications } = useReadContract({
  //   address: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
  //   abi: HEALTH_AUTHORITY_REGISTRY_ABI,
  //   functionName: 'getPendingApplications',
  // });

  // Placeholder for contract data
  const registryStats: any = null;
  const allAuthorities: any = null;
  const pendingApplications: any = null;

  // Mock data for demonstration
  const mockAuthorities: Authority[] = [
    {
      address: '0xF0AcD34E64736F6AB60E39088469ae86fF165AA9',
      name: 'Lisk Health Authority Demo',
      authorityType: AuthorityType.Government,
      country: 'Switzerland',
      region: 'Zug',
      publicKey: '0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      certificateHash: 'QmSampleCertificateHashForLiskDemo',
      contactInfo: 'contact@lisk-health.demo',
      status: AuthorityStatus.Active,
      registeredAt: Date.now() - 86400000,
      totalRecordsIssued: 150,
      totalRecordsRevoked: 2
    },
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'City General Hospital',
      authorityType: AuthorityType.Hospital,
      country: 'United States',
      region: 'California',
      publicKey: '0xabcdef1234567890abcdef1234567890abcdef12',
      certificateHash: 'QmHospitalCertificateHash123',
      contactInfo: 'admin@citygeneral.com',
      status: AuthorityStatus.Pending,
      registeredAt: Date.now() - 43200000,
      totalRecordsIssued: 0,
      totalRecordsRevoked: 0
    }
  ];

  const handleSubmitApplication = async (formData: any) => {
    try {
      // Generate a mock public key for demo
      const publicKey = `0x${Math.random().toString(16).slice(2, 66)}` as `0x${string}`;
      
      // Temporarily commented out due to wagmi v2 API changes
      // await writeContract({
      //   address: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
      //   abi: HEALTH_AUTHORITY_REGISTRY_ABI,
      //   functionName: 'submitApplication',
      //   args: [
      //     formData.name,
      //     formData.authorityType,
      //     formData.country,
      //     formData.region,
      //     publicKey,
      //     formData.certificateHash,
      //     formData.contactInfo,
      //     formData.accreditations || []
      //   ],
      // });
      
      // Simulate successful submission for demo
      console.log('Would submit application:', { ...formData, publicKey });

      toast.success('Application submitted successfully!');
      setShowApplicationModal(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
  };

  const getStatusIcon = (status: AuthorityStatus) => {
    switch (status) {
      case AuthorityStatus.Active:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case AuthorityStatus.Pending:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case AuthorityStatus.Suspended:
      case AuthorityStatus.Revoked:
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: AuthorityStatus) => {
    switch (status) {
      case AuthorityStatus.Active:
        return 'text-green-600 bg-green-50';
      case AuthorityStatus.Pending:
        return 'text-yellow-600 bg-yellow-50';
      case AuthorityStatus.Suspended:
      case AuthorityStatus.Revoked:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredAuthorities = mockAuthorities.filter(auth => {
    if (activeTab === 'pending') return auth.status === AuthorityStatus.Pending;
    if (activeTab === 'active') return auth.status === AuthorityStatus.Active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Authority Manager</h2>
          <p className="text-gray-600 mt-1">Manage health authority registrations and applications</p>
        </div>
        <button
          onClick={() => setShowApplicationModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Apply as Authority</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[0]?.toString() : mockAuthorities.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[1]?.toString() : 
                 mockAuthorities.filter(a => a.status === AuthorityStatus.Active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[2]?.toString() : 
                 mockAuthorities.filter(a => a.status === AuthorityStatus.Pending).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[3]?.toString() : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Revoked</p>
              <p className="text-2xl font-bold text-gray-900">
                {registryStats ? registryStats[4]?.toString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Authorities', count: mockAuthorities.length },
            { id: 'active', name: 'Active', count: mockAuthorities.filter(a => a.status === AuthorityStatus.Active).length },
            { id: 'pending', name: 'Pending', count: mockAuthorities.filter(a => a.status === AuthorityStatus.Pending).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Authorities List */}
      <div className="card">
        {filteredAuthorities.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No authorities found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'pending' 
                ? 'No pending applications at the moment'
                : 'No authorities registered yet'
              }
            </p>
            <button
              onClick={() => setShowApplicationModal(true)}
              className="btn-primary"
            >
              Apply as Health Authority
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuthorities.map((authority) => (
              <div
                key={authority.address}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{authority.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {AUTHORITY_TYPE_LABELS[authority.authorityType]}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {authority.region}, {authority.country}
                          </span>
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {authority.contactInfo}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {authority.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Records Issued</p>
                      <p className="text-lg font-semibold text-gray-900">{authority.totalRecordsIssued}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Registered</p>
                      <p className="text-xs text-gray-500">
                        {new Date(authority.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(authority.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(authority.status)}`}>
                        {AUTHORITY_STATUS_LABELS[authority.status]}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedAuthority(authority)}
                      className="text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          onClose={() => setShowApplicationModal(false)}
          onSubmit={handleSubmitApplication}
          isLoading={isPending}
        />
      )}

      {/* Authority Details Modal */}
      {selectedAuthority && (
        <AuthorityDetailsModal
          authority={selectedAuthority}
          onClose={() => setSelectedAuthority(null)}
        />
      )}
    </div>
  );
};

// Application Modal Component
const ApplicationModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    authorityType: AuthorityType.Hospital,
    country: '',
    region: '',
    contactInfo: '',
    certificateHash: '',
    accreditations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accreditations = formData.accreditations 
      ? formData.accreditations.split(',').map(s => s.trim())
      : [];
    onSubmit({ ...formData, accreditations });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply as Health Authority</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                placeholder="City General Hospital"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authority Type *
              </label>
              <select
                value={formData.authorityType}
                onChange={(e) => setFormData({...formData, authorityType: parseInt(e.target.value)})}
                className="input-field"
                required
              >
                {Object.entries(AUTHORITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="input-field"
                placeholder="United States"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region/State *
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="input-field"
                placeholder="California"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information *
            </label>
            <input
              type="email"
              value={formData.contactInfo}
              onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
              className="input-field"
              placeholder="admin@hospital.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Hash (IPFS)
            </label>
            <input
              type="text"
              value={formData.certificateHash}
              onChange={(e) => setFormData({...formData, certificateHash: e.target.value})}
              className="input-field"
              placeholder="QmCertificateHash123..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accreditations (comma-separated)
            </label>
            <input
              type="text"
              value={formData.accreditations}
              onChange={(e) => setFormData({...formData, accreditations: e.target.value})}
              className="input-field"
              placeholder="WHO, FDA, Local Health Authority"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Authority Details Modal Component
const AuthorityDetailsModal: React.FC<{
  authority: Authority;
  onClose: () => void;
}> = ({ authority, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Authority Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{authority.name}</h4>
              <p className="text-gray-600">{AUTHORITY_TYPE_LABELS[authority.authorityType]}</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(authority.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(authority.status)}`}>
                  {AUTHORITY_STATUS_LABELS[authority.status]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {authority.region}, {authority.country}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {authority.contactInfo}
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Statistics</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Records Issued:</span>
                  <span className="font-medium">{authority.totalRecordsIssued}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Records Revoked:</span>
                  <span className="font-medium">{authority.totalRecordsRevoked}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium">{new Date(authority.registeredAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Technical Details</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                  {authority.address}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Public Key</label>
                <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                  {authority.publicKey}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate Hash</label>
                <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
                  {authority.certificateHash}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Close
          </button>
          <button className="btn-primary flex-1">
            <Globe className="w-4 h-4 mr-2" />
            View on Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

function getStatusIcon(status: AuthorityStatus) {
  switch (status) {
    case AuthorityStatus.Active:
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case AuthorityStatus.Pending:
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case AuthorityStatus.Suspended:
    case AuthorityStatus.Revoked:
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
}

function getStatusColor(status: AuthorityStatus) {
  switch (status) {
    case AuthorityStatus.Active:
      return 'text-green-600 bg-green-50';
    case AuthorityStatus.Pending:
      return 'text-yellow-600 bg-yellow-50';
    case AuthorityStatus.Suspended:
    case AuthorityStatus.Revoked:
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export default AuthorityManager;
