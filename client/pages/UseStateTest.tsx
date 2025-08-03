import React, { useState } from "react";

function UseStateTest() {
  // Test useState step by step
  console.log('Component starting...');
  console.log('React:', React);
  console.log('useState function:', useState);
  
  try {
    console.log('Calling useState...');
    const [message, setMessage] = useState("useState is working!");
    const [count, setCount] = useState(0);
    console.log('useState called successfully');
    
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h1>🎉 useState Test Successful!</h1>
          <p>Multi-Account Ledger Application</p>
          
          <div style={{ margin: '20px 0' }}>
            <p><strong>Message:</strong> {message}</p>
            <p><strong>Count:</strong> {count}</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => setMessage("Button clicked!")}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#10b981',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                margin: '5px',
                fontWeight: 'bold'
              }}
            >
              Change Message
            </button>
            
            <button 
              onClick={() => setCount(count + 1)}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#059669',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                margin: '5px',
                fontWeight: 'bold'
              }}
            >
              Increment Count
            </button>
          </div>
          
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            <p>✅ React imported successfully</p>
            <p>✅ useState hook working</p>
            <p>✅ State updates functional</p>
            <p>✅ Events working properly</p>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={() => {
                // Simulate loading the full app
                window.location.href = '/';
              }}
              style={{
                padding: '12px 24px',
                background: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Load Full Application
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('useState error:', error);
    
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: '#dc2626',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h1>❌ useState Failed</h1>
          <p>Error: {error instanceof Error ? error.message : String(error)}</p>
          <p>Check browser console for details</p>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default UseStateTest;
