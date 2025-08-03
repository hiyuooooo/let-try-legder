import * as React from "react";

// Safe tooltip provider that doesn't break the app
export const SafeTooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Simple tooltip implementation that won't break
export const SafeTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const SafeTooltipTrigger: React.FC<{ 
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  if (asChild) {
    return <>{children}</>;
  }
  return <div>{children}</div>;
};

export const SafeTooltipContent: React.FC<{ 
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  hidden?: boolean;
  [key: string]: any;
}> = ({ children, hidden, ...props }) => {
  if (hidden) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 50,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
      {...props}
    >
      {children}
    </div>
  );
};
