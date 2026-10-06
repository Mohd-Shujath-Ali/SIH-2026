import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error in component tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-4xl mx-auto my-8 bg-[#121927] border border-red-500/40 rounded-xl text-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-base font-bold uppercase tracking-wider font-mono">
              {this.props.fallbackTitle || "View Rendering Error"}
            </h2>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            An issue occurred while rendering this module:
          </p>
          <pre className="p-3 bg-black/60 border border-red-900/40 rounded text-xs font-mono text-red-300 overflow-x-auto mb-4">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold font-mono flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
