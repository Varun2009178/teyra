'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class VisibleErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-red-950/50 border-2 border-red-500 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              ERROR - READ THIS:
            </h1>

            <div className="bg-black/50 p-4 rounded mb-4 overflow-auto max-h-96">
              <p className="text-red-300 font-mono text-sm mb-2">
                <strong>Error Message:</strong>
              </p>
              <p className="text-white font-mono text-xs mb-4">
                {this.state.error?.message || 'Unknown error'}
              </p>

              <p className="text-red-300 font-mono text-sm mb-2">
                <strong>Error Name:</strong>
              </p>
              <p className="text-white font-mono text-xs mb-4">
                {this.state.error?.name || 'Unknown'}
              </p>

              <p className="text-red-300 font-mono text-sm mb-2">
                <strong>Stack Trace:</strong>
              </p>
              <pre className="text-white font-mono text-xs whitespace-pre-wrap">
                {this.state.error?.stack || 'No stack trace'}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg"
            >
              REFRESH PAGE
            </button>

            <p className="text-white/60 text-xs mt-4 text-center">
              Screenshot this entire screen and send it
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
