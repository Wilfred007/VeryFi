import React, { useState } from 'react';
import { useMidnightMCP } from '../services/midnight-mcp';
import { Bot, Play, CheckCircle, XCircle, Loader } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const AIAgentTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { client, isAvailable } = useMidnightMCP();

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    setTests(prev => prev.map(t => t.name === name ? { ...t, status: 'pending' as const } : t));
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      setTests(prev => prev.map(t => 
        t.name === name 
          ? { ...t, status: 'success' as const, result, duration }
          : t
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTests(prev => prev.map(t => 
        t.name === name 
          ? { ...t, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error', duration }
          : t
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Initialize test list
    const testList: TestResult[] = [
      { name: 'Connection Test', status: 'pending' },
      { name: 'Wallet Status', status: 'pending' },
      { name: 'Wallet Balance', status: 'pending' },
      { name: 'Transaction History', status: 'pending' },
      { name: 'Create Health Proof', status: 'pending' },
      { name: 'List Health Proofs', status: 'pending' },
      { name: 'Verify Health Proof', status: 'pending' },
    ];
    
    setTests(testList);

    // Run tests sequentially
    await runTest('Connection Test', () => client.testConnection());
    
    await runTest('Wallet Status', () => client.getWalletStatus());
    
    await runTest('Wallet Balance', () => client.getWalletBalance());
    
    await runTest('Transaction History', () => client.getTransactions(3));
    
    let createdProofHash = '';
    await runTest('Create Health Proof', async () => {
      const result = await client.createHealthProof({
        patientName: `AI Test Patient ${Date.now()}`,
        recordType: 'vaccination',
        vaccinationType: 'COVID-19',
        vaccinationDate: new Date().toISOString().split('T')[0]
      });
      createdProofHash = result.proofHash;
      return result;
    });
    
    await runTest('List Health Proofs', () => client.getHealthProofs(5));
    
    if (createdProofHash) {
      await runTest('Verify Health Proof', () => client.verifyHealthProof(createdProofHash));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Bot className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">AI Agent Tester</h2>
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Running Tests...' : 'Run AI Agent Tests'}</span>
        </button>
      </div>

      {tests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Test Results</h3>
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                {test.duration && (
                  <span className="text-sm text-gray-500">{test.duration}ms</span>
                )}
              </div>
              
              {test.error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  Error: {test.error}
                </div>
              )}
              
              {test.result && test.status === 'success' && (
                <div className="text-green-700 text-sm bg-green-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                    {JSON.stringify(test.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">About AI Agent Testing</h4>
        <p className="text-blue-800 text-sm">
          This tester simulates how an AI agent (like ElizaOS) would interact with your ZK Health Pass system.
          Each test represents a tool that an AI agent can use through the MCP protocol.
        </p>
      </div>
    </div>
  );
};

export default AIAgentTester;
