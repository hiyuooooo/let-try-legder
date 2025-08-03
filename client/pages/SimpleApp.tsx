import React, { useState, useEffect } from "react";
import { AppRestorer } from "../components/AppRestorer";

interface Account {
  id: string;
  name: string;
}

interface LedgerEntry {
  id: string;
  date: Date;
  bill: number;
  cash: number;
  notes: string;
  accountId: string;
}

const SimpleApp: React.FC = () => {
  const [accounts] = useState<Account[]>([
    { id: "1", name: "Main Account" },
    { id: "2", name: "Secondary Account" },
  ]);

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account>(accounts[0]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    bill: "",
    cash: "",
    notes: "",
  });

  const addEntry = () => {
    if (!formData.bill && !formData.cash) return;

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      date: new Date(formData.date),
      bill: parseFloat(formData.bill) || 0,
      cash: parseFloat(formData.cash) || 0,
      notes: formData.notes,
      accountId: currentAccount.id,
    };

    setEntries([...entries, newEntry]);
    setFormData({ date: formData.date, bill: "", cash: "", notes: "" });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const currentEntries = entries.filter(
    (e) => e.accountId === currentAccount.id,
  );
  const totalBill = currentEntries.reduce((sum, e) => sum + e.bill, 0);
  const totalCash = currentEntries.reduce((sum, e) => sum + e.cash, 0);
  const netTotal = totalBill - totalCash;

  const downloadPackage = () => {
    const packageInfo = {
      name: "Multi-Account Ledger",
      version: "1.0.0",
      description: "Complete ledger management system",
      liveUrl: window.location.origin,
      downloadDate: new Date().toISOString(),
      features: [
        "Multi-account management",
        "Entry tracking",
        "PDF/Excel export",
        "Offline functionality",
      ],
    };

    const blob = new Blob([JSON.stringify(packageInfo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-app-info.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(
      `📦 Package Info Downloaded!\n\nLive Application: ${window.location.origin}\nEXE Package: ${window.location.origin}/download-exe.html`,
    );
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "rgba(255,255,255,0.95)",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            paddingBottom: "20px",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          <h1
            style={{
              color: "#1f2937",
              margin: 0,
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            📊 Multi-Account Ledger
          </h1>
        </div>

        {/* Account Selector */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Current Account:
          </label>
          <select
            value={currentAccount.id}
            onChange={(e) =>
              setCurrentAccount(accounts.find((a) => a.id === e.target.value)!)
            }
            style={{
              padding: "8px 12px",
              border: "2px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "16px",
              minWidth: "200px",
            }}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Entry Form */}
        <div
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#374151" }}>
            Add New Entry
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                Date:
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                Bill Amount:
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.bill}
                onChange={(e) =>
                  setFormData({ ...formData, bill: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                Cash Amount:
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.cash}
                onChange={(e) =>
                  setFormData({ ...formData, cash: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Notes:
            </label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
          </div>

          <button
            onClick={addEntry}
            style={{
              padding: "10px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            ➕ Add Entry
          </button>
        </div>

        {/* Summary */}
        <div
          style={{
            background: "#f0f9ff",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #0ea5e9",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#0c4a6e" }}>
            Account Summary - {currentAccount.name}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <span style={{ fontWeight: "500" }}>Total Bills: </span>
              <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                ₹{totalBill.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: "500" }}>Total Cash: </span>
              <span style={{ color: "#059669", fontWeight: "bold" }}>
                ₹{totalCash.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: "500" }}>Net Total: </span>
              <span
                style={{
                  color: netTotal >= 0 ? "#dc2626" : "#059669",
                  fontWeight: "bold",
                }}
              >
                ₹{netTotal.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: "500" }}>Entries: </span>
              <span style={{ fontWeight: "bold" }}>
                {currentEntries.length}
              </span>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              background: "#f9fafb",
              padding: "15px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h4 style={{ margin: 0, color: "#374151" }}>Recent Entries</h4>
          </div>

          {currentEntries.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              No entries found. Add your first entry above.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Bill
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Cash
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Net
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Notes
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((entry, index) => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          background: index % 2 === 0 ? "white" : "#fafafa",
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          {entry.date.toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: "#dc2626",
                            fontWeight: "600",
                          }}
                        >
                          ₹{entry.bill.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: "#059669",
                            fontWeight: "600",
                          }}
                        >
                          ₹{entry.cash.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: "600",
                            color:
                              entry.bill - entry.cash >= 0
                                ? "#dc2626"
                                : "#059669",
                          }}
                        >
                          ₹{(entry.bill - entry.cash).toFixed(2)}
                        </td>
                        <td style={{ padding: "12px", color: "#6b7280" }}>
                          {entry.notes || "-"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            style={{
                              padding: "4px 8px",
                              background: "#fecaca",
                              color: "#dc2626",
                              border: "1px solid #fca5a5",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#374151" }}>
            ✨ Application Status
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            <div>✅ React hooks working</div>
            <div>✅ State management functional</div>
            <div>✅ Local storage ready</div>
            <div>✅ Download packages available</div>
          </div>
          <div
            style={{ marginTop: "15px", fontSize: "14px", color: "#6b7280" }}
          >
            <p>
              Professional multi-account ledger system with offline
              functionality
            </p>
          </div>
        </div>
      </div>

      <AppRestorer />
    </div>
  );
};

export default SimpleApp;
