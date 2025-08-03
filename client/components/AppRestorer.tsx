import React from "react";

export const AppRestorer: React.FC = () => {
  const restoreFullApp = () => {
    if (
      confirm(
        "🔄 Restore Full Application?\n\nThis will switch back to the complete Multi-Account Ledger with all advanced features.\n\nNote: If React hook errors persist, you may need to refresh the page.",
      )
    ) {
      // This would restore the full Index component
      alert(
        "To restore the full app:\n\n1. Edit client/App.tsx\n2. Change SimpleApp back to Index\n3. Save the file\n\nThe full app includes:\n✅ Advanced UI components\n✅ All ledger features\n✅ PDF/Excel export\n✅ Good in Cart tracking\n✅ Multiple accounts\n✅ Import/Export functionality",
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <button
        onClick={restoreFullApp}
        style={{
          padding: "12px 20px",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🔄 Restore Full App
      </button>
    </div>
  );
};
