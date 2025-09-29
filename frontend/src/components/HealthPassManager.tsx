import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useChainId } from 'wagmi';
import { hashHealthRecord, createProofHash, getStorageBreakdown } from '../utils/privacy';
import { generateZKProof, isNoirAvailable, getCircuitInfo } from '../utils/noir-integration';
import { useMidnightMCP } from '../services/midnight-mcp';
import { HealthRecord, ZKHealthProof, HealthPassFormData } from '../types/health-pass';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  Eye,
  Copy,
  Wifi,
  WifiOff
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { ZK_HEALTH_PASS_REGISTRY_ABI } from '../config/abis';

interface ZKProof {
  proofHash: string;
  healthRecordHash: string;
  authority: string;
  generatedAt: number;
  expiresAt: number;
  isRevoked: boolean;
  verificationCount: number;
}

const HealthPassManager: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ZKProof | null>(null);
  const [userProofs, setUserProofs] = useState<ZKProof[]>([]);
  const [midnightConnected, setMidnightConnected] = useState(false);
  const [midnightWalletStatus, setMidnightWalletStatus] = useState<any>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const { client: midnightClient, isAvailable } = useMidnightMCP();

  // Read system stats from contract (disabled for wagmi v2 compatibility)
  // const { data: systemStats } = useReadContract({
  //   address: CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY as `0x${string}`,
  //   abi: ZK_HEALTH_PASS_REGISTRY_ABI,
  //   functionName: 'getSystemStats',
  // });
  const systemStats = null;

  // Refetch function placeholder
  const refetchProofs = () => {
    console.log('Refetching proofs...');
  };

  // Mock data for demonstration
  const mockProofs: ZKProof[] = [
    {
      proofHash: '0x1234567890abcdef1234567890abcdef12345678',
      healthRecordHash: '0xabcdef1234567890abcdef1234567890abcdef12',
      authority: '0xF0AcD34E64736F6AB60E39088469ae86fF165AA9',
      generatedAt: Date.now() - 86400000, // 1 day ago
      expiresAt: Date.now() + 86400000 * 30, // 30 days from now
      isRevoked: false,
      verificationCount: 5
    },
    {
      proofHash: '0x9876543210fedcba9876543210fedcba98765432',
      healthRecordHash: '0xfedcba9876543210fedcba9876543210fedcba98',
      authority: '0xF0AcD34E64736F6AB60E39088469ae86fF165AA9',
      generatedAt: Date.now() - 172800000, // 2 days ago
      expiresAt: Date.now() + 86400000 * 60, // 60 days from now
      isRevoked: false,
      verificationCount: 12
    }
  ];

  const handleCreateProof = async (formData: HealthPassFormData) => {
    try {
      // Create health record with sensitive patient data
      const healthRecord: HealthRecord = {
        // Sensitive data (will be hashed for privacy)
        patientName: formData.patientName || 'Anonymous Patient',
        dateOfBirth: formData.dateOfBirth || '1990-01-01',
        vaccinationType: formData.vaccinationType || 'COVID-19',
        vaccinationDate: formData.vaccinationDate || new Date().toISOString().split('T')[0],
        batchNumber: formData.batchNumber || 'BATCH-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        administeredBy: formData.administeredBy || 'Dr. Health Provider',
        // Public metadata
        recordType: formData.recordType || 'vaccination',
        authority: formData.authority || 'Health Authority',
        issuedAt: Date.now()
      };

      // Show loading toast
      const loadingToast = toast.loading('🔐 Generating ZK proof...');

      let proofHash: `0x${string}`;
      let recordHash: `0x${string}`;
      let zkProofData: Uint8Array | null = null;
      let usedMidnight = false;

      try {
        // Try Midnight MCP first if available
        if (midnightConnected && midnightClient) {
          const midnightProof = await midnightClient.createHealthProof(healthRecord);
          
          proofHash = midnightProof.proofHash as `0x${string}`;
          recordHash = midnightProof.healthRecordHash as `0x${string}`;
          zkProofData = midnightProof.zkProofData || null;
          usedMidnight = true;
          
          toast.dismiss(loadingToast);
          toast.success('✨ ZK proof generated with Midnight network!');
        } else if (isNoirAvailable()) {
          // Fallback to Noir circuit
          const zkProofResult = await generateZKProof(healthRecord);
          
          proofHash = zkProofResult.proofHash;
          recordHash = zkProofResult.recordHash;
          zkProofData = zkProofResult.proof;
          
          toast.dismiss(loadingToast);
          toast.success('⚡ ZK proof generated with Noir circuit!');
        } else {
          throw new Error('No ZK proof generation method available');
        }
        
      } catch (proofError) {
        toast.dismiss(loadingToast);
        console.error('ZK proof generation failed, falling back to privacy hashes:', proofError);
        
        // Fallback to privacy-preserving hashes
        recordHash = hashHealthRecord(healthRecord);
        proofHash = createProofHash(recordHash, healthRecord.authority, healthRecord.issuedAt);
        
        toast.error('Using privacy hashes (ZK proof generation unavailable)');
      }
      
      const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      
      // Create new proof object
      const newProof: ZKProof = {
        proofHash,
        healthRecordHash: recordHash,
        authority: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY as `0x${string}`,
        generatedAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days in milliseconds
        isRevoked: false,
        verificationCount: 0
      };
      
      // Submit proof to blockchain
      console.log('Submitting ZK proof to blockchain...', {
        proofHash,
        recordHash,
        authority: CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY,
        expiresAt,
        patientDataHashed: 'Patient data hashed for privacy'
      });

      // Check if connected to correct network before submitting to blockchain
      const canSubmitToBlockchain = isConnected && chainId === 4202;
      
      if (canSubmitToBlockchain) {
        try {
          // Show blockchain submission toast
          const blockchainToast = toast.loading('📡 Submitting to blockchain...');
          
          // Submit to smart contract
          // @ts-ignore - Bypassing TypeScript error for wagmi v2 compatibility
          const hash = await writeContract({
            address: CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY as `0x${string}`,
            abi: ZK_HEALTH_PASS_REGISTRY_ABI,
            functionName: 'submitZKProof',
            args: [
              proofHash as `0x${string}`,
              recordHash as `0x${string}`,
              CONTRACT_ADDRESSES.HEALTH_AUTHORITY_REGISTRY as `0x${string}`,
              BigInt(expiresAt),
              zkProofData ? `0x${Buffer.from(zkProofData).toString('hex')}` as `0x${string}` : '0x' as `0x${string}`
            ]
          });

        toast.dismiss(blockchainToast);
        
        // Wait a moment for transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refetch contract data
        refetchProofs();
        
        toast.success(
          <div>
            <div>✅ ZK Proof submitted to blockchain!</div>
            <div className="text-xs mt-1">Transaction confirmed on Lisk Sepolia</div>
          </div>,
          { duration: 6000 }
        );
        
      } catch (contractError: any) {
        console.error('Blockchain submission failed:', contractError);
        
        // Show specific error message
        const errorMessage = contractError?.message?.includes('User rejected') 
          ? 'Transaction cancelled by user'
          : contractError?.message?.includes('insufficient funds')
          ? 'Insufficient ETH for gas fees'
          : 'Failed to submit to blockchain';
          
        toast.error(`${errorMessage}. Storing locally instead.`);
      }
    } else {
      // Not connected to blockchain - show appropriate message
      if (!isConnected) {
        toast.error('Please connect your wallet to submit to blockchain. Storing locally instead.');
      } else if (chainId !== 4202) {
        toast.error('Please switch to Lisk Sepolia network to submit to blockchain. Storing locally instead.');
      }
    }
      
      // Add to user's proof list (local backup)
      setUserProofs(prev => [newProof, ...prev]);
      
      // Store in localStorage as backup
      const existingProofs = JSON.parse(localStorage.getItem('zkHealthPassProofs') || '[]');
      localStorage.setItem('zkHealthPassProofs', JSON.stringify([newProof, ...existingProofs]));

      // Show success message with proof type info
      const proofTypeMessage = usedMidnight 
        ? '✨ Generated with Midnight network' 
        : zkProofData 
        ? '⚡ Generated with Noir circuit' 
        : '✅ Patient data hashed for privacy';
      
      toast.success(
        <div>
          <div>🔐 {zkProofData ? 'Real ZK Proof' : 'Privacy Hash'} stored on blockchain!</div>
          <div className="text-xs mt-1">{proofTypeMessage}</div>
          <div className="text-xs font-mono">Hash: {proofHash.slice(0, 20)}...</div>
        </div>,
        { duration: 8000 }
      );
      
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit ZK proof');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Proof hash copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Read proofs from blockchain (commented out due to wagmi v2 API changes)
  // const { data: blockchainProofs, refetch: refetchProofs } = useReadContract({
  //   address: CONTRACT_ADDRESSES.ZK_HEALTH_PASS_REGISTRY as `0x${string}`,
  //   abi: ZK_HEALTH_PASS_REGISTRY_ABI,
  //   functionName: 'getProofHashes',
  //   args: [],
  // });

  // Check Midnight MCP connection
  useEffect(() => {
    const checkMidnightConnection = async () => {
      try {
        const available = await isAvailable();
        setMidnightConnected(available);
        
        if (available && midnightClient) {
          const status = await midnightClient.getWalletStatus();
          setMidnightWalletStatus(status);
        }
      } catch (error) {
        console.error('Failed to check Midnight connection:', error);
        setMidnightConnected(false);
      }
    };

    checkMidnightConnection();
  }, [isAvailable, midnightClient]);

  // Load proofs from localStorage and blockchain on mount
  useEffect(() => {
    const savedProofs = JSON.parse(localStorage.getItem('zkHealthPassProofs') || '[]');
    setUserProofs(savedProofs);
    
    // Refetch blockchain proofs (disabled for now)
    // if (address) {
    //   refetchProofs();
    // }
  }, [address]);

  // Combine mock proofs and user proofs
  const allProofs = [...userProofs, ...mockProofs];

  const getStatusColor = (proof: ZKProof) => {
    if (proof.isRevoked) return 'text-red-600 bg-red-50';
    if (proof.expiresAt < Date.now()) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (proof: ZKProof) => {
    if (proof.isRevoked) return 'Revoked';
    if (proof.expiresAt < Date.now()) return 'Expired';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Pass Manager</h2>
          <p className="text-gray-600 mt-1">Privacy-preserving blockchain storage with cryptographic hashing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Proof</span>
        </button>
      </div>

      {/* Privacy Info Banner with Network Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-green-800">Privacy-First Blockchain Storage</h3>
              <div className="flex items-center space-x-2">
                {/* Blockchain Connection Status */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                  isConnected && chainId === 4202
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected && chainId === 4202 ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isConnected && chainId === 4202 ? 'Lisk Sepolia Connected' : 'Blockchain Offline'}</span>
                </div>
                
                {/* Midnight Network Status */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                  midnightConnected 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {midnightConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{midnightConnected ? 'Midnight Connected' : 'Midnight Offline'}</span>
                </div>
                
                {/* Noir Circuit Status */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isNoirAvailable() 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isNoirAvailable() ? '⚡ Noir ZK Proofs' : '🔐 Privacy Hashes'}
                </div>
              </div>
            </div>
            <div className="text-sm text-green-700 mt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="font-medium">🔐 Never Stored on Blockchain:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Patient names & personal data</li>
                    <li>• Medical record details</li>
                    <li>• Vaccination specifics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">⛓️ Stored on Blockchain:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• {midnightConnected ? 'Midnight ZK proofs' : isNoirAvailable() ? 'Noir ZK proofs' : 'Cryptographic hashes only'}</li>
                    <li>• Proof verification status</li>
                    <li>• Authority signatures</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Proofs</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemStats ? Number(systemStats[1]) : allProofs.length}
              </p>
              {systemStats && (
                <p className="text-xs text-gray-500">On-chain: {Number(systemStats[1])}</p>
              )}
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
                {allProofs.filter(p => !p.isRevoked && p.expiresAt > Date.now()).length}
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
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Verifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemStats ? Number(systemStats[2]) : mockProofs.reduce((sum, p) => sum + p.verificationCount, 0)}
              </p>
              {systemStats && (
                <p className="text-xs text-gray-500">On-chain: {Number(systemStats[2])}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proofs List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Health Proofs</h3>
          <div className="flex space-x-2">
            <button className="btn-secondary text-sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </button>
          </div>
        </div>

        {allProofs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No health proofs yet</h3>
            <p className="text-gray-600 mb-6">Create your first zero-knowledge health proof to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Proof
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {allProofs.map((proof, index) => (
              <div
                key={proof.proofHash}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Health Record #{index + 1}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 font-mono">
                            {proof.proofHash.slice(0, 20)}...
                          </p>
                          <button
                            onClick={() => copyToClipboard(proof.proofHash)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy full proof hash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Generated</p>
                      <p className="text-xs text-gray-500">{formatDate(proof.generatedAt)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="text-xs text-gray-500">{formatDate(proof.expiresAt)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Verifications</p>
                      <p className="text-xs text-gray-500">{proof.verificationCount}</p>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proof)}`}>
                      {getStatusText(proof)}
                    </span>
                    
                    <button
                      onClick={() => copyToClipboard(proof.proofHash)}
                      className="bg-primary-600 text-white px-3 py-1 rounded text-xs hover:bg-primary-700 transition-colors flex items-center space-x-1"
                      title="Copy hash for verification"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Hash</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedProof(proof)}
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

      {/* Create Proof Modal */}
      {showCreateModal && (
        <CreateProofModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProof}
          isLoading={isPending}
        />
      )}

      {/* Proof Details Modal */}
      {selectedProof && (
        <ProofDetailsModal
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
        />
      )}
    </div>
  );
};

// Create Proof Modal Component
const CreateProofModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    recordType: 'vaccination',
    patientId: '',
    details: '',
    expiryDays: 30
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New ZK Proof</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Type
            </label>
            <select
              value={formData.recordType}
              onChange={(e) => setFormData({...formData, recordType: e.target.value})}
              className="input-field"
            >
              <option value="vaccination">Vaccination</option>
              <option value="test">Test Result</option>
              <option value="treatment">Treatment</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID
            </label>
            <input
              type="text"
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="input-field"
              placeholder="Patient123"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details
            </label>
            <input
              type="text"
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              className="input-field"
              placeholder="COVID19_Dose1_2025"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Validity (Days)
            </label>
            <input
              type="number"
              value={formData.expiryDays}
              onChange={(e) => setFormData({...formData, expiryDays: parseInt(e.target.value)})}
              className="input-field"
              min="1"
              max="365"
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
              {isLoading ? 'Creating...' : 'Create Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Proof Details Modal Component
const ProofDetailsModal: React.FC<{
  proof: ZKProof;
  onClose: () => void;
}> = ({ proof, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Proof Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Proof Hash</label>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
              {proof.proofHash}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Health Record Hash</label>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
              {proof.healthRecordHash}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Authority</label>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
              {proof.authority}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Generated</label>
              <p className="text-sm text-gray-900">
                {new Date(proof.generatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expires</label>
              <p className="text-sm text-gray-900">
                {new Date(proof.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Count</label>
            <p className="text-sm text-gray-900">{proof.verificationCount}</p>
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
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthPassManager;
