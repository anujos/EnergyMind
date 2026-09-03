import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React lifecycle:', error, errorInfo);
  }

  public handleReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex items-center justify-center p-6 font-mono">
          <div className="max-w-lg w-full bg-[#111622] border border-red-500/40 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-950/60 rounded border border-red-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Application Runtime Error</h1>
                <p className="text-xs text-gray-400">An unexpected exception was caught by ErrorBoundary.</p>
              </div>
            </div>

            <div className="bg-black/60 rounded p-3 text-xs text-red-300 font-mono overflow-x-auto border border-red-900/40">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload & Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
