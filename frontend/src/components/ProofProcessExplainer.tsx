import React, { useState } from 'react';
import { HelpCircle, X, Shield, Server, Database, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ProofProcessExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="How ZK Proofs Work"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              ZK Health Pass: How It Works
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Process Overview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                🔄 Hybrid On-Chain/Off-Chain Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900">Off-Chain (Private)</h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Patient data processing</li>
                        <li>• ZK proof generation (Noir circuit)</li>
                        <li>• Cryptographic hashing</li>
                        <li>• ECDSA signature verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Database className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900">On-Chain (Public)</h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Proof hash storage</li>
                        <li>• Verification records</li>
                        <li>• Authority signatures</li>
                        <li>• Expiration timestamps</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Process */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Step-by-Step Process
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Health Record Input</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient enters health information (vaccination details, medical records, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Off-Chain ZK Proof Generation</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Noir circuit processes the data locally, generates ECDSA signatures, and creates a zero-knowledge proof
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Privacy-Preserving Hashing</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient data is hashed using Keccak256 with salt. Original data never leaves the device.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Blockchain Storage</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Only the proof hash and record hash are stored on Lisk Sepolia blockchain. No personal data.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Verification Process</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Verifiers can check proof validity using the hash without accessing personal health information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Implementation Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🚀 Current Implementation Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">Noir circuit simulation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">Privacy-preserving hashing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">Blockchain storage ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">ECDSA signature generation</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-900">Real Noir.js integration (pending)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-900">Live blockchain calls (demo mode)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">End-to-end proof workflow</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">Verification system</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Guarantees */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                🔐 Privacy Guarantees
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Never Stored on Blockchain:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Patient names and personal identifiers</li>
                    <li>• Medical record details</li>
                    <li>• Vaccination specifics (type, date, batch)</li>
                    <li>• Doctor/administrator information</li>
                    <li>• Any sensitive health data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Stored on Blockchain:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Cryptographic proof hashes only</li>
                    <li>• Verification timestamps</li>
                    <li>• Authority public keys</li>
                    <li>• Expiration dates</li>
                    <li>• Verification status</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Your Proof Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                🎯 Your Proof Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm text-blue-900">
                    <strong>Proof Hash:</strong> 0x4fd58a3e0149a792e2938ed2f19b0f5f9b56bf1b299abfff92923d59a8bf92dc
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-blue-900">
                    <strong>Status:</strong> Valid format, ready for verification
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-900">
                    <strong>Privacy:</strong> Your health data was hashed and never stored on blockchain
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofProcessExplainer;
