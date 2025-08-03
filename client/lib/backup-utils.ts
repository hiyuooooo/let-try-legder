import { AppData } from "@shared/types";
import { saveAppData, loadAppData } from "./storage";

interface BackupMetadata {
  id: string;
  timestamp: Date;
  description: string;
  entryCount: number;
  accountCount: number;
  isAutomatic: boolean;
}

interface BackupData {
  metadata: BackupMetadata;
  data: AppData;
}

const BACKUP_STORAGE_KEY = "ledger-backups";
const LAST_BACKUP_KEY = "last-backup-timestamp";
const BACKUP_INTERVAL_DAYS = 2;

// Get all backups from localStorage
export const getBackups = (): BackupData[] => {
  try {
    const backupsStr = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!backupsStr) return [];

    const backups = JSON.parse(backupsStr);
    return backups.map((backup: any) => ({
      ...backup,
      metadata: {
        ...backup.metadata,
        timestamp: new Date(backup.metadata.timestamp),
      },
      data: {
        ...backup.data,
        accounts:
          backup.data.accounts?.map((account: any) => ({
            ...account,
            createdAt: new Date(account.createdAt),
            lastUsed: new Date(account.lastUsed),
          })) || [],
        ledgerEntries:
          backup.data.ledgerEntries?.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          })) || [],
        goodInCartEntries:
          backup.data.goodInCartEntries?.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          })) || [],
      },
    }));
  } catch (error) {
    console.error("Error loading backups:", error);
    return [];
  }
};

// Save backups to localStorage
const saveBackups = (backups: BackupData[]): void => {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
  } catch (error) {
    console.error("Error saving backups:", error);
  }
};

// Create a new backup
export const createBackup = (
  data: AppData,
  description: string,
  isAutomatic: boolean = false,
): BackupData => {
  const backup: BackupData = {
    metadata: {
      id: Date.now().toString(),
      timestamp: new Date(),
      description,
      entryCount: data.ledgerEntries.length + data.goodInCartEntries.length,
      accountCount: data.accounts.length,
      isAutomatic,
    },
    data: { ...data },
  };

  const backups = getBackups();
  backups.push(backup);

  // Keep only last 20 backups to prevent storage overflow
  if (backups.length > 20) {
    backups.splice(0, backups.length - 20);
  }

  saveBackups(backups);

  // Update last backup timestamp
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

  return backup;
};

// Check if automatic backup is needed
export const shouldCreateAutoBackup = (): boolean => {
  try {
    const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackupStr) return true;

    const lastBackup = new Date(lastBackupStr);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysDiff >= BACKUP_INTERVAL_DAYS;
  } catch (error) {
    console.error("Error checking backup schedule:", error);
    return true;
  }
};

// Create automatic backup if needed
export const createAutoBackupIfNeeded = (data: AppData): BackupData | null => {
  if (shouldCreateAutoBackup()) {
    return createBackup(
      data,
      `Auto backup - ${new Date().toLocaleDateString("en-GB")}`,
      true,
    );
  }
  return null;
};

// Restore from backup
export const restoreFromBackup = (backupId: string): AppData | null => {
  try {
    const backups = getBackups();
    const backup = backups.find((b) => b.metadata.id === backupId);

    if (!backup) {
      throw new Error("Backup not found");
    }

    // Save the restored data
    saveAppData(backup.data);

    return backup.data;
  } catch (error) {
    console.error("Error restoring backup:", error);
    return null;
  }
};

// Delete a backup
export const deleteBackup = (backupId: string): void => {
  try {
    const backups = getBackups();
    const updatedBackups = backups.filter((b) => b.metadata.id !== backupId);
    saveBackups(updatedBackups);
  } catch (error) {
    console.error("Error deleting backup:", error);
  }
};

// Export backup as JSON file
export const exportBackup = (backupId: string): void => {
  try {
    const backups = getBackups();
    const backup = backups.find((b) => b.metadata.id === backupId);

    if (!backup) {
      throw new Error("Backup not found");
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-backup-${backup.metadata.timestamp.toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting backup:", error);
    throw error;
  }
};

// Import backup from JSON file
export const importBackup = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);

        // Validate backup structure
        if (!backupData.metadata || !backupData.data) {
          throw new Error("Invalid backup file format");
        }

        // Convert date strings back to Date objects
        const processedBackup: BackupData = {
          metadata: {
            ...backupData.metadata,
            timestamp: new Date(backupData.metadata.timestamp),
            id: Date.now().toString(), // Generate new ID to avoid conflicts
          },
          data: {
            ...backupData.data,
            accounts:
              backupData.data.accounts?.map((account: any) => ({
                ...account,
                createdAt: new Date(account.createdAt),
                lastUsed: new Date(account.lastUsed),
              })) || [],
            ledgerEntries:
              backupData.data.ledgerEntries?.map((entry: any) => ({
                ...entry,
                date: new Date(entry.date),
              })) || [],
            goodInCartEntries:
              backupData.data.goodInCartEntries?.map((entry: any) => ({
                ...entry,
                date: new Date(entry.date),
              })) || [],
          },
        };

        // Add to backup list
        const backups = getBackups();
        backups.push(processedBackup);
        saveBackups(backups);

        resolve(processedBackup);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read backup file"));
    reader.readAsText(file);
  });
};

// Export all app data as backup
export const exportCurrentDataAsBackup = (data: AppData): void => {
  const backup = createBackup(
    data,
    `Manual backup - ${new Date().toLocaleDateString("en-GB")}`,
    false,
  );
  exportBackup(backup.metadata.id);
};

// Get backup statistics
export const getBackupStats = () => {
  const backups = getBackups();
  const automatic = backups.filter((b) => b.metadata.isAutomatic).length;
  const manual = backups.filter((b) => !b.metadata.isAutomatic).length;
  const lastBackup =
    backups.length > 0 ? backups[backups.length - 1].metadata.timestamp : null;

  return {
    total: backups.length,
    automatic,
    manual,
    lastBackup,
  };
};
