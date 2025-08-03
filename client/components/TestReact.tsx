import React, { useState } from "react";

// Simple test component to verify React hooks are working
export const TestReact: React.FC = () => {
  try {
    const [test] = useState("React hooks working!");
    return <div style={{ display: 'none' }}>{test}</div>;
  } catch (error) {
    console.error('React hooks test failed:', error);
    return null;
  }
};
