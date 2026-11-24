import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface RootProps {
  children: ReactNode;
}

interface RootState {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<RootProps, RootState> {
  public state: RootState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): RootState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Flight Price Intelligence error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "#f8fafc" }}>
          <div style={{ maxWidth: "480px", width: "100%", background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "20px", fontWeight: "bold" }}>
              !
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Application Error</h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ width: "100%", padding: "12px", background: "#0b5cad", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
