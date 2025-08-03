import React from "react";

// Component to check if React hooks are available
export const ReactCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if React hooks are available
  try {
    const [isReady] = React.useState(true);
    
    if (!isReady) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <h1>🔄 Initializing...</h1>
            <p>Setting up the application...</p>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('React hooks not available:', error);
    
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h1>⚠️ Loading Issue</h1>
          <p>React hooks are not available. This might be a temporary loading issue.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
};
