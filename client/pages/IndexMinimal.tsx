import React from "react";

const IndexMinimal: React.FC = () => {
  // Test if React is available
  if (!React) {
    return <div>React not available</div>;
  }

  // Test if useState is available
  if (!React.useState) {
    return <div>React.useState not available</div>;
  }

  try {
    const [test] = React.useState("React working!");
    
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
          <h1>📊 Multi-Account Ledger</h1>
          <p>{test}</p>
          <p>React is working properly!</p>
          <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
            <p>✅ React: Available</p>
            <p>✅ useState: Working</p>
            <p>✅ Component: Rendered</p>
          </div>
          <button 
            onClick={() => alert('Button clicked! React events working.')}
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
            Test Click Event
          </button>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#dc2626',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h1>❌ React Error</h1>
          <p>useState failed: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default IndexMinimal;
