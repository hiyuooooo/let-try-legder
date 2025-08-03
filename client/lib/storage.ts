import { AppData, Account, LedgerEntry, GoodInCartEntry } from "@shared/types";

const STORAGE_KEY = "ledger-app-data";
const BACKUP_KEY = "ledger-app-backup";

// Default app data
const getDefaultAppData = (): AppData => {
  const defaultAccount: Account = {
    id: "default",
    name: "Main Account",
    createdAt: new Date(),
    lastUsed: new Date(),
  };

  return {
    accounts: [defaultAccount],
    ledgerEntries: [],
    goodInCartEntries: [],
    currentAccountId: "default",
    lastUsedDates: {},
    monthlyNetTotals: [],
  };
};

// Load data from localStorage
export const loadAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAppData();
    }

    const data = JSON.parse(stored);

    // Convert date strings back to Date objects
    data.accounts =
      data.accounts?.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        lastUsed: new Date(account.lastUsed),
      })) || [];

    data.ledgerEntries =
      data.ledgerEntries?.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      })) || [];

    data.goodInCartEntries =
      data.goodInCartEntries?.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      })) || [];

    // Ensure we have at least one account
    if (data.accounts.length === 0) {
      const defaultData = getDefaultAppData();
      data.accounts = defaultData.accounts;
      data.currentAccountId = defaultData.currentAccountId;
    }

    // Ensure monthlyNetTotals exists (for backward compatibility)
    if (!data.monthlyNetTotals) {
      data.monthlyNetTotals = [];
    }

    return data;
  } catch (error) {
    console.error("Error loading app data:", error);
    return getDefaultAppData();
  }
};

// Save data to localStorage
export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Also create a backup
    const backup = {
      data: data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error("Error saving app data:", error);
  }
};

// Export data as JSON for backup
export const exportDataAsJSON = (data: AppData): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `ledger-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Import data from JSON
export const importDataFromJSON = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate the data structure
        if (!data.accounts || !Array.isArray(data.accounts)) {
          throw new Error("Invalid data format: accounts array is missing");
        }

        // Convert date strings back to Date objects
        data.accounts = data.accounts.map((account: any) => ({
          ...account,
          createdAt: new Date(account.createdAt),
          lastUsed: new Date(account.lastUsed),
        }));

        data.ledgerEntries = (data.ledgerEntries || []).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
        }));

        data.goodInCartEntries = (data.goodInCartEntries || []).map(
          (entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }),
        );

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

// Validate date format (dd/mm/yyyy)
export const validateDateFormat = (dateStr: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateStr)) return false;

  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
};

// Parse dd/mm/yyyy date string
export const parseDateString = (dateStr: string): Date | null => {
  if (!validateDateFormat(dateStr)) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

// Format date as dd/mm/yyyy
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString("en-GB");
};

// Get current date in dd/mm/yyyy format
export const getCurrentDateString = (): string => {
  return formatDateForDisplay(new Date());
};

// Auto-backup functionality
export const setupAutoBackup = (
  data: AppData,
  intervalMinutes: number = 30,
): (() => void) => {
  const interval = setInterval(
    () => {
      try {
        const backup = {
          data: data,
          timestamp: new Date().toISOString(),
          auto: true,
        };
        localStorage.setItem(
          `auto-backup-${Date.now()}`,
          JSON.stringify(backup),
        );

        // Keep only last 10 auto-backups
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith("auto-backup-"),
        );
        if (keys.length > 10) {
          keys
            .sort()
            .slice(0, keys.length - 10)
            .forEach((key) => {
              localStorage.removeItem(key);
            });
        }
      } catch (error) {
        console.error("Auto-backup failed:", error);
      }
    },
    intervalMinutes * 60 * 1000,
  );

  return () => clearInterval(interval);
};
