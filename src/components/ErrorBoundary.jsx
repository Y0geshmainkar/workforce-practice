import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-slate-600">
          <span className="text-5xl mb-4">⚠️</span>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
