import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, forward to your error tracking service (e.g., Sentry):
    // if (typeof window.Sentry !== 'undefined') {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
    // console.error intentionally removed — do not log sensitive error details to browser console in production
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full p-6">
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 flex flex-col items-center justify-center max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred while rendering this page. Try the options below.
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Reload page
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              If this persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
