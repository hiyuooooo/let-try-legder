// Simple React test without any external dependencies

function SimpleTest() {
  // Don't use any hooks, just render
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      background: '#667eea',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>
        <h1>🎉 React is Working!</h1>
        <p>Multi-Account Ledger Application</p>
        <p>✅ Component rendered successfully</p>
        <p>✅ No React hooks needed for this test</p>
        
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => {
              alert('Button click works! React events are functional.');
            }}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Test React Events
          </button>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.9 }}>
          <p>If you can see this, React is working properly.</p>
          <p>The issue might be with hooks or specific imports.</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleTest;
