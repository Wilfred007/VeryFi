import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details but don't crash the app
    console.warn('Wallet connection error caught by boundary:', error, errorInfo);
    
    // Filter out known non-critical wallet errors
    const nonCriticalErrors = [
      'share-modal',
      'addEventListener',
      'openapi_fetch',
      'Analytics',
      'WalletConnect',
      'Coinbase'
    ];
    
    const isNonCritical = nonCriticalErrors.some(keyword => 
      error.message?.includes(keyword) || error.stack?.includes(keyword)
    );
    
    if (isNonCritical) {
      // Reset error boundary for non-critical errors
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Render fallback UI for critical errors only
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Connection Issue
              </h2>
              <p className="text-gray-600 mb-6">
                There was an issue with wallet connections. The app is still functional.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Continue to App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
