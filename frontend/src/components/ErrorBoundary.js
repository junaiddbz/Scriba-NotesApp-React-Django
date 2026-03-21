import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (in production, you'd send this to an error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // TODO: Send to error tracking service like Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/notes';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI based on props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-app-dark flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 rounded-lg border border-red-700/30 p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle className="text-red-400" size={32} />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-4">
                Something went wrong
              </h1>

              {/* Message */}
              <p className="text-gray-400 mb-6">
                {this.props.message || 'An unexpected error occurred. Please try again or return to the home page.'}
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-900 rounded-lg text-left overflow-auto max-h-40">
                  <p className="text-xs text-red-400 font-mono break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  <FiRefreshCw size={18} />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FiHome size={18} />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage with functional components
export const withErrorBoundary = (WrappedComponent, fallbackProps = {}) => {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary {...fallbackProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

// Compact error boundary for smaller sections
export const SectionErrorBoundary = ({ children, sectionName = 'This section' }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-red-400">
                {sectionName} failed to load
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please refresh the page or try again later.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;