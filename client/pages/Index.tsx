import React, { useState, useEffect, useCallback } from "react";
import {
  Account,
  LedgerEntry,
  GoodInCartEntry,
  AppData,
  LedgerSummary,
  FilterOptions,
  GoodInCartReport,
  GoodInCartReportRow,
} from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Calculator,
  Filter,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit,
  Printer,
  Settings,
  Users,
  Upload,
  ChevronDown,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  exportToExcel,
  exportToPDF,
  openPrintPreview,
} from "@/lib/export-utils";
import { loadAppData, saveAppData, getCurrentDateString } from "@/lib/storage";
import {
  importFromExcel,
  validateExcelFile,
  downloadExcelTemplate,
} from "@/lib/import-utils";
import {
  createAutoBackupIfNeeded,
  getBackups,
  createBackup,
  restoreFromBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  exportCurrentDataAsBackup,
  getBackupStats,
} from "@/lib/backup-utils";
import {
  getCumulativeNetTotal,
  getMonthlyNetTotal,
  updateAllMonthlyTotalsForAccount,
  cleanupOldMonthlyTotals,
  getAllPreviousMonthsTotal,
} from "@/lib/monthly-totals";

export default function Index() {
  // App data state
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<
    | "ledger"
    | "goodInCart"
    | "reports"
    | "accounts"
    | "import"
    | "backups"
    | "netTotalMonth"
    | "shortcuts"
  >("ledger");
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [renameAccountId, setRenameAccountId] = useState("");
  const [renameAccountName, setRenameAccountName] = useState("");

  // Good in Cart state
  const [goodInCartForm, setGoodInCartForm] = useState({
    date: getCurrentDateString(),
    value: "",
    notes: "गाड़ी में सामान",
  });
  const [useCurrentDateGIC, setUseCurrentDateGIC] = useState(false);
  const [editingGICEntry, setEditingGICEntry] =
    useState<GoodInCartEntry | null>(null);
  const [isGICEditDialogOpen, setIsGICEditDialogOpen] = useState(false);

  // Good in Cart filter state
  const [gicFilterEndDate, setGicFilterEndDate] = useState("");
  const [gicFilterStartDate, setGicFilterStartDate] = useState("");
  const [gicReport, setGicReport] = useState<GoodInCartReport | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: getCurrentDateString(),
    bill: "",
    cash: "",
    notes: "",
  });
  const [useCurrentDate, setUseCurrentDate] = useState(false);
  const [lastEnteredDate, setLastEnteredDate] = useState(
    getCurrentDateString(),
  );

  // Shortcuts state
  const [formFieldFocus, setFormFieldFocus] = useState(0); // 0: date, 1: bill, 2: cash, 3: notes

  // Filter state
  const [filter, setFilter] = useState<FilterOptions>({
    type: "dateRange",
  });
  const [filterDateRange, setFilterDateRange] = useState({
    start: "",
    end: "",
  });
  const [filterMonth, setFilterMonth] = useState("");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Backup state
  const [backups, setBackups] = useState(getBackups());
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);

  // Initialize current account
  useEffect(() => {
    if (appData.accounts.length > 0) {
      const account =
        appData.accounts.find((a) => a.id === appData.currentAccountId) ||
        appData.accounts[0];
      setCurrentAccount(account);

      // Update current account ID if it changed
      if (account.id !== appData.currentAccountId) {
        const updatedData = { ...appData, currentAccountId: account.id };
        setAppData(updatedData);
        saveAppData(updatedData);
      }
    }
  }, [appData.accounts, appData.currentAccountId]);

  // Auto-save data changes and create auto-backup if needed
  useEffect(() => {
    saveAppData(appData);

    // Create automatic backup every 2 days
    const autoBackup = createAutoBackupIfNeeded(appData);
    if (autoBackup) {
      setBackups(getBackups());
      console.log("Auto-backup created:", autoBackup.metadata.description);
    }
  }, [appData]);

  // Update current date when toggle is used
  useEffect(() => {
    if (useCurrentDate) {
      setFormData((prev) => ({ ...prev, date: getCurrentDateString() }));
    }
  }, [useCurrentDate]);

  // Update current date for Good in Cart when toggle is used
  useEffect(() => {
    if (useCurrentDateGIC) {
      setGoodInCartForm((prev) => ({ ...prev, date: getCurrentDateString() }));
    }
  }, [useCurrentDateGIC]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle form field navigation when in Add Entry tab with Ctrl+Arrow
      if (activeTab === "ledger" && event.ctrlKey && (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        const formFields = ["date", "bill", "cash", "notes"];

        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            if (formFieldFocus > 0) {
              const newFocus = formFieldFocus - 1;
              setFormFieldFocus(newFocus);
              const element = document.getElementById(formFields[newFocus]);
              element?.focus();
            }
            break;
          case "ArrowRight":
            event.preventDefault();
            if (formFieldFocus < formFields.length - 1) {
              const newFocus = formFieldFocus + 1;
              setFormFieldFocus(newFocus);
              const element = document.getElementById(formFields[newFocus]);
              element?.focus();
            }
            break;
        }
        return;
      }

      // Global shortcuts when not in form fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Only allow Enter to submit entry in ledger tab
        if (event.key === "Enter" && activeTab === "ledger") {
          event.preventDefault();
          handleSaveEntry();
        }
        return;
      }

      // Tab navigation shortcuts (always enabled)
      switch (event.key) {
        case "1":
          event.preventDefault();
          setActiveTab("ledger");
          break;
        case "2":
          event.preventDefault();
          setActiveTab("goodInCart");
          break;
        case "3":
          event.preventDefault();
          setActiveTab("reports");
          break;
        case "4":
          event.preventDefault();
          setActiveTab("shortcuts");
          break;
        case "Enter":
          if (activeTab === "ledger") {
            event.preventDefault();
            handleSaveEntry();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, formFieldFocus]);

  // Helper functions
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-GB");
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) return null;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const calculateTotal = (bill: number, cash: number) => {
    const total = bill - cash;
    const profitLoss = total < 0 ? "Profit" : total > 0 ? "Loss" : "";
    return { total, profitLoss };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas for thousands separation
  const formatNumberWithCommas = (value: string): string => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');

    // Add commas for thousands separation
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Remove commas from formatted number
  const removeCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const handleSaveEntry = () => {
    if (!currentAccount) return;

    const date = parseDateString(formData.date);
    const bill = parseFloat(formData.bill.replace(/,/g, '')) || 0;
    const cash = parseFloat(formData.cash.replace(/,/g, '')) || 0;

    if (!date) {
      alert("Please enter a valid date in dd/mm/yyyy format");
      return;
    }

    // Validate that at least one of bill or cash has a value
    if (bill === 0 && cash === 0) {
      alert("Please enter a value for Bill Amount or Cash Amount");
      return;
    }

    const { total, profitLoss } = calculateTotal(bill, cash);

    const entry: LedgerEntry = {
      id: editingEntry?.id || Date.now().toString(),
      date,
      bill,
      cash,
      total,
      profitLoss: profitLoss as "Profit" | "Loss" | "",
      notes: formData.notes,
      accountId: currentAccount.id,
    };

    let updatedEntries;
    if (editingEntry) {
      updatedEntries = appData.ledgerEntries.map((e) =>
        e.id === editingEntry.id ? entry : e,
      );
    } else {
      updatedEntries = [...appData.ledgerEntries, entry];
    }

    // Update app data with new entries and refresh monthly totals cache
    let updatedAppData = { ...appData, ledgerEntries: updatedEntries };
    updatedAppData = updateAllMonthlyTotalsForAccount(
      updatedAppData,
      currentAccount.id,
    );
    updatedAppData = cleanupOldMonthlyTotals(updatedAppData);

    setAppData(updatedAppData);

    // Store the last entered date for persistence
    setLastEnteredDate(formData.date);

    // Reset form but keep the last entered date
    setFormData({
      date: formData.date,
      bill: "",
      cash: "",
      notes: "",
    });
    setEditingEntry(null);
    setIsEditDialogOpen(false);
  };

  // Account management functions
  const createAccount = () => {
    if (!newAccountName.trim()) return;

    const newAccount: Account = {
      id: Date.now().toString(),
      name: newAccountName.trim(),
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    const updatedData = {
      ...appData,
      accounts: [...appData.accounts, newAccount],
      currentAccountId: newAccount.id,
    };

    setAppData(updatedData);
    setNewAccountName("");
    setIsAccountDialogOpen(false);
  };

  const switchAccount = (accountId: string) => {
    const account = appData.accounts.find((a) => a.id === accountId);
    if (!account) return;

    const updatedAccounts = appData.accounts.map((a) =>
      a.id === accountId ? { ...a, lastUsed: new Date() } : a,
    );

    const updatedData = {
      ...appData,
      accounts: updatedAccounts,
      currentAccountId: accountId,
    };

    setAppData(updatedData);
    setCurrentAccount(account);
  };

  const renameAccount = (accountId: string, newName: string) => {
    if (!newName.trim()) return;

    const updatedAccounts = appData.accounts.map((a) =>
      a.id === accountId ? { ...a, name: newName.trim() } : a,
    );

    setAppData({ ...appData, accounts: updatedAccounts });
    setRenameAccountId("");
    setRenameAccountName("");
  };

  const deleteAccount = (accountId: string) => {
    if (appData.accounts.length <= 1) {
      alert("Cannot delete the last account");
      return;
    }

    const updatedAccounts = appData.accounts.filter((a) => a.id !== accountId);
    const updatedLedgerEntries = appData.ledgerEntries.filter(
      (e) => e.accountId !== accountId,
    );

    let newCurrentAccountId = appData.currentAccountId;
    if (accountId === appData.currentAccountId) {
      newCurrentAccountId = updatedAccounts[0].id;
    }

    const updatedData = {
      ...appData,
      accounts: updatedAccounts,
      ledgerEntries: updatedLedgerEntries,
      currentAccountId: newCurrentAccountId,
    };

    setAppData(updatedData);
  };

  // Ledger management functions
  const getCurrentAccountEntries = (): LedgerEntry[] => {
    return appData.ledgerEntries.filter(
      (entry) => entry.accountId === (currentAccount?.id || ""),
    );
  };

  // Good in Cart management functions
  const getCurrentAccountGICEntries = (): GoodInCartEntry[] => {
    return appData.goodInCartEntries.filter(
      (entry) => entry.accountId === (currentAccount?.id || ""),
    );
  };

  const getPreviousGoodInCartDate = (selectedDate: Date): Date | null => {
    const gicEntries = getCurrentAccountGICEntries();
    const dates = gicEntries
      .map((e) => e.date)
      .sort((a, b) => a.getTime() - b.getTime());

    // Compare using date strings to avoid timezone issues
    const selectedDateStr = selectedDate.toISOString().split("T")[0];

    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = dates[i].toISOString().split("T")[0];
      if (dateStr < selectedDateStr) return dates[i];
    }
    return dates.length > 0 ? dates[0] : null; // fallback to first date if no previous date
  };

  const generateGoodInCartReport = (
    endDateStr: string,
  ): GoodInCartReport | null => {
    if (!endDateStr || !currentAccount) return null;

    // Create the GIC entry date from the selected date string
    const gicEntryDate = new Date(endDateStr + "T12:00:00");

    // The actual end date is the day after the last GIC entry (process complete date)
    const endDate = new Date(gicEntryDate);
    endDate.setDate(endDate.getDate() + 1);

    const startDate = getPreviousGoodInCartDate(gicEntryDate);

    if (!startDate) return null;

    const gicEntries = getCurrentAccountGICEntries();
    const ledgerEntries = getCurrentAccountEntries();

    // Filter ledger entries from startDate up to but NOT including endDate
    const ledgerFiltered = ledgerEntries.filter((e) => {
      // Include entries from startDate (inclusive) up to endDate (exclusive)
      return e.date >= startDate && e.date < endDate;
    });

    // Get Good in Cart amounts using date string comparison for accuracy
    const startDateStr = startDate.toISOString().split("T")[0];
    const gicEntryDateStr = gicEntryDate.toISOString().split("T")[0];

    // Find Good in Cart entries by matching dates
    const startGICEntry = gicEntries.find(
      (e) => e.date.toISOString().split("T")[0] === startDateStr,
    );
    const endGICEntry = gicEntries.find(
      (e) => e.date.toISOString().split("T")[0] === gicEntryDateStr,
    );

    const startX = startGICEntry?.value || 0;
    const endX = endGICEntry?.value || 0;

    // Debug: Check if we found the entries
    console.log("Selected GIC entry date string:", endDateStr);
    console.log("GIC entry date:", gicEntryDate);
    console.log("Process end date:", endDate);
    console.log("GIC entry date string:", gicEntryDateStr);
    console.log(
      "Available Good in Cart dates:",
      gicEntries.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        value: e.value,
      })),
    );
    console.log("Found end GIC entry:", endGICEntry);
    console.log("End X value:", endX);

    // Construct report rows
    const reportRows: GoodInCartReportRow[] = [];

    // Add Good in Cart at startDate as Bill
    reportRows.push({
      id: `gic-start-${startDate.getTime()}`,
      date: startDate,
      bill: startX,
      cash: 0,
      total: startX,
      profitLoss: "Good in Cart",
      notes: "गाड़ी म���ं सामान",
      isGoodInCart: true,
    });

    // Add filtered ledger entries (sorted by date, remove duplicates)
    const uniqueLedgerEntries = ledgerFiltered.filter(
      (entry, index, self) =>
        index ===
        self.findIndex(
          (e) =>
            e.id === entry.id ||
            (e.date.getTime() === entry.date.getTime() &&
              e.bill === entry.bill &&
              e.cash === entry.cash),
        ),
    );

    uniqueLedgerEntries
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((e) => {
        const total = (e.bill || 0) - (e.cash || 0);
        reportRows.push({
          ...e,
          total,
          profitLoss: total < 0 ? "Profit" : total > 0 ? "Loss" : "",
          isLedgerEntry: true,
          // Clean the notes - remove "Imported from Excel" text
          notes:
            e.notes
              ?.replace(/Imported from Excel on \d{2}\/\d{2}\/\d{4}/, "")
              .trim() || "",
        });
      });

    // Add Good in Cart completion at process end date as Cash (always add, even if 0)
    reportRows.push({
      id: `gic-end-${endDate.getTime()}`,
      date: endDate,
      bill: 0,
      cash: endX,
      total: -endX,
      profitLoss: "Process Complete",
      notes: "Process Complete - गाड़ी में सामान",
      isGoodInCart: true,
    });

    // Calculate total profit/loss
    const overallTotal = reportRows.reduce((sum, r) => sum + (r.total || 0), 0);
    const overallPL =
      overallTotal < 0 ? "Profit" : overallTotal > 0 ? "Loss" : "Break-even";

    return {
      reportRows,
      overallTotal,
      overallPL,
      startDate,
      endDate,
      startX,
      endX,
    };
  };

  // Helper function to get days in month considering leap year
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to generate complete date range
  const getCompleteDateRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Helper function to generate complete month dates
  const getCompleteMonthDates = (year: number, month: number): Date[] => {
    const dates: Date[] = [];
    const daysInMonth = getDaysInMonth(year, month + 1); // month is 0-indexed

    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }

    return dates;
  };

  const getFilteredEntries = (): LedgerEntry[] => {
    const accountEntries = getCurrentAccountEntries();

    if (
      filter.type === "dateRange" &&
      filterDateRange.start &&
      filterDateRange.end
    ) {
      const startDate = new Date(filterDateRange.start);
      const endDate = new Date(filterDateRange.end);

      // Get only existing entries in the date range, remove duplicates
      const entriesInRange = accountEntries.filter(
        (entry) => entry.date >= startDate && entry.date <= endDate,
      );

      const entriesByDate = new Map<string, LedgerEntry>();

      // Remove duplicates by keeping first entry for each date
      entriesInRange.forEach((entry) => {
        const dateKey = entry.date.toDateString();
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, entry);
        }
      });

      // Return only actual entries, sorted in ascending order
      return Array.from(entriesByDate.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
    } else if (filter.type === "month" && filterMonth) {
      const [year, month] = filterMonth.split("-");
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1; // 0-indexed

      // Calculate cumulative total from January up to and including the selected month
      let cumulativeTotal = 0;

      // Get all entries from January to the selected month (inclusive)
      for (let m = 0; m <= monthNum; m++) {
        const monthEntries = accountEntries.filter(
          (entry) =>
            entry.date.getFullYear() === yearNum && entry.date.getMonth() === m,
        );

        const monthTotal = monthEntries.reduce(
          (sum, entry) => sum + entry.total,
          0,
        );
        cumulativeTotal += monthTotal;
      }

      // Get only existing entries for the selected month
      const monthEntries = accountEntries.filter(
        (entry) =>
          entry.date.getFullYear() === yearNum &&
          entry.date.getMonth() === monthNum,
      );

      // Remove duplicates by keeping first entry for each date
      const entriesByDate = new Map<string, LedgerEntry>();
      monthEntries.forEach((entry) => {
        const dateKey = entry.date.toDateString();
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, entry);
        }
      });

      // Return only actual entries (no previous month entry), sorted in ascending order
      return Array.from(entriesByDate.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
    }
    return accountEntries.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const calculateSummary = (entries: LedgerEntry[]): LedgerSummary => {
    const totalBills = entries.reduce((sum, entry) => sum + entry.bill, 0);
    const totalCash = entries.reduce((sum, entry) => sum + entry.cash, 0);
    const netProfitLoss = totalBills - totalCash;
    const netType =
      netProfitLoss < 0 ? "Profit" : netProfitLoss > 0 ? "Loss" : "Break-even";

    return {
      totalBills,
      totalCash,
      netProfitLoss,
      netType,
      entriesCount: entries.length,
    };
  };

  // Calculate summary for selected month only (not cumulative)
  const calculateMonthlySummary = (selectedMonth: string): LedgerSummary => {
    if (!selectedMonth || !currentAccount) {
      return calculateSummary([]);
    }

    const [year, month] = selectedMonth.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // 0-indexed

    // Get entries only for the selected month
    const monthEntries = getCurrentAccountEntries().filter(
      (entry) =>
        entry.date.getFullYear() === yearNum &&
        entry.date.getMonth() === monthNum,
    );

    const totalBills = monthEntries.reduce((sum, entry) => sum + entry.bill, 0);
    const totalCash = monthEntries.reduce((sum, entry) => sum + entry.cash, 0);
    const netProfitLoss = totalBills - totalCash;
    const netType =
      netProfitLoss < 0 ? "Profit" : netProfitLoss > 0 ? "Loss" : "Break-even";

    // Get ALL previous months total (across all years)
    const previousTotal = getAllPreviousMonthsTotal(
      appData,
      yearNum,
      monthNum,
      currentAccount.id,
    );

    return {
      totalBills,
      totalCash,
      netProfitLoss,
      netType,
      entriesCount: monthEntries.length,
      previousTotal: previousTotal,
      currentMonthTotal: netProfitLoss,
      cumulativeTotal: previousTotal + netProfitLoss,
      isMonthlyView: true,
    };
  };

  // Calculate cumulative summary for monthly view (January to selected month inclusive)
  const calculateCumulativeSummary = (): LedgerSummary => {
    if (filter.type !== "month" || !filterMonth || !currentAccount) {
      return calculateSummary(getFilteredEntries());
    }

    const [year, month] = filterMonth.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // 0-indexed

    // Get current month net total
    const currentMonthNetTotal = getMonthlyNetTotal(
      appData,
      yearNum,
      monthNum,
      currentAccount.id,
    );

    // Get previous total (cumulative up to previous month)
    const previousTotal = getCumulativeNetTotal(
      appData,
      yearNum,
      monthNum - 1,
      currentAccount.id,
    );

    // Use cached cumulative total for better performance (current + previous)
    const cumulativeNetTotal = getCumulativeNetTotal(
      appData,
      yearNum,
      monthNum,
      currentAccount.id,
    );

    let cumulativeBills = 0;
    let cumulativeCash = 0;
    let totalEntries = 0;

    // Sum from January to selected month (inclusive)
    for (let m = 0; m <= monthNum; m++) {
      const monthEntries = getCurrentAccountEntries().filter(
        (entry) =>
          entry.date.getFullYear() === yearNum && entry.date.getMonth() === m,
      );

      cumulativeBills += monthEntries.reduce(
        (sum, entry) => sum + entry.bill,
        0,
      );
      cumulativeCash += monthEntries.reduce(
        (sum, entry) => sum + entry.cash,
        0,
      );
      totalEntries += monthEntries.length;
    }

    const netProfitLoss = cumulativeNetTotal; // Use cached cumulative value
    const netType =
      netProfitLoss < 0 ? "Profit" : netProfitLoss > 0 ? "Loss" : "Break-even";

    return {
      totalBills: cumulativeBills,
      totalCash: cumulativeCash,
      netProfitLoss,
      netType,
      entriesCount: totalEntries,
      previousTotal: previousTotal, // Previous cumulative total
      currentMonthTotal: currentMonthNetTotal, // Current month only
      cumulativeTotal: cumulativeNetTotal, // Full cumulative total
      isMonthlyView: true,
    };
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    setFormData({
      date: formatDateForDisplay(entry.date),
      bill: entry.bill.toString(),
      cash: entry.cash.toString(),
      notes: entry.notes || "",
    });
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = appData.ledgerEntries.filter((e) => e.id !== id);
    setAppData({ ...appData, ledgerEntries: updatedEntries });
  };

  // Good in Cart entry management
  const handleSaveGICEntry = () => {
    if (!currentAccount) return;

    const date = parseDateString(goodInCartForm.date);
    const value = parseFloat(goodInCartForm.value) || 0;

    if (!date) {
      alert("Please enter a valid date in dd/mm/yyyy format");
      return;
    }

    if (value <= 0) {
      alert("Please enter a valid Good in Cart value");
      return;
    }

    const entry: GoodInCartEntry = {
      id: editingGICEntry?.id || Date.now().toString(),
      date,
      value,
      notes: goodInCartForm.notes,
      accountId: currentAccount.id,
    };

    let updatedEntries;
    if (editingGICEntry) {
      updatedEntries = appData.goodInCartEntries.map((e) =>
        e.id === editingGICEntry.id ? entry : e,
      );
    } else {
      updatedEntries = [...appData.goodInCartEntries, entry];
    }

    setAppData({ ...appData, goodInCartEntries: updatedEntries });

    // Reset form
    setGoodInCartForm({
      date: getCurrentDateString(),
      value: "",
      notes: "गाड़ी में सामान",
    });
    setEditingGICEntry(null);
    setIsGICEditDialogOpen(false);
  };

  const handleEditGICEntry = (entry: GoodInCartEntry) => {
    setGoodInCartForm({
      date: formatDateForDisplay(entry.date),
      value: entry.value.toString(),
      notes: entry.notes || "गाड़ी में सामा���",
    });
    setEditingGICEntry(entry);
    setIsGICEditDialogOpen(true);
  };

  const handleDeleteGICEntry = (id: string) => {
    const updatedEntries = appData.goodInCartEntries.filter((e) => e.id !== id);
    setAppData({ ...appData, goodInCartEntries: updatedEntries });
  };

  // Handle Good in Cart filter
  const handleGICEndDateChange = (dateStr: string) => {
    setGicFilterEndDate(dateStr);

    if (dateStr) {
      // Parse the GIC entry date
      const gicEntryDate = new Date(dateStr + "T12:00:00");
      const startDate = getPreviousGoodInCartDate(gicEntryDate);

      if (startDate) {
        setGicFilterStartDate(startDate.toISOString().split("T")[0]);
        // Generate report with the selected GIC entry date
        const report = generateGoodInCartReport(dateStr);

        if (report) {
          // The report now uses the proper process end date internally
          setGicReport(report);
        }
      }
    } else {
      setGicFilterStartDate("");
      setGicReport(null);
    }
  };

  // Import functionality
  const handleImportExcel = async () => {
    if (!importFile || !currentAccount) return;

    try {
      const isValid = await validateExcelFile(importFile);
      if (!isValid) {
        alert("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }

      const result = await importFromExcel(importFile, currentAccount.id);
      setImportResult(result);

      if (result.success && (result as any).entries) {
        const updatedEntries = [
          ...appData.ledgerEntries,
          ...(result as any).entries,
        ];
        setAppData({ ...appData, ledgerEntries: updatedEntries });
      }
    } catch (error) {
      alert(`Import failed: ${error}`);
    }
  };

  // Export functionality
  const handleExport = (format: "excel" | "pdf-a4" | "pdf-a5") => {
    console.log("Export started with format:", format);
    console.log("Current summary:", summary);
    console.log("Filtered entries count:", filteredEntries.length);
    try {
      // Check if we're exporting Good in Cart report
      if (activeTab === "reports" && gicReport) {
        const reportInfo = `Good in Cart Report: ${formatDateForDisplay(gicReport.startDate)} to ${formatDateForDisplay(gicReport.endDate)}`;

        // Convert Good in Cart report to regular format for export
        const exportEntries = gicReport.reportRows.map((row) => ({
          id: row.id,
          date: row.date,
          bill: row.bill,
          cash: row.cash,
          total: row.total,
          profitLoss:
            row.profitLoss === "Good in Cart"
              ? "गाड़ी में सामान"
              : row.profitLoss === "Process Complete"
                ? "Process Complete"
                : row.profitLoss,
          notes: row.notes,
          accountId: currentAccount?.id || "",
        })) as LedgerEntry[];

        const gicSummary = {
          totalBills: gicReport.reportRows.reduce((sum, r) => sum + r.bill, 0),
          totalCash: gicReport.reportRows.reduce((sum, r) => sum + r.cash, 0),
          netProfitLoss: gicReport.overallTotal,
          netType: gicReport.overallPL,
          entriesCount: gicReport.reportRows.length,
        } as LedgerSummary;

        if (format === "excel") {
          exportToExcel(
            exportEntries,
            gicSummary,
            `${currentAccount?.name} - ${reportInfo}`,
          );
        } else if (format === "pdf-a4") {
          exportToPDF(
            exportEntries,
            gicSummary,
            `${currentAccount?.name} - ${reportInfo}`,
            "a4",
          );
        } else if (format === "pdf-a5") {
          exportToPDF(
            exportEntries,
            gicSummary,
            `${currentAccount?.name} - ${reportInfo}`,
            "a5",
          );
        }
      } else {
        // Regular ledger export
        const filteredEntries = getFilteredEntries();
        const summary =
          filter.type === "month" && filterMonth
            ? calculateMonthlySummary(filterMonth)
            : calculateSummary(filteredEntries);

        const filterInfo =
          filter.type === "dateRange" &&
          filterDateRange.start &&
          filterDateRange.end
            ? `Date Range: ${new Date(filterDateRange.start).toLocaleDateString("en-GB")} to ${new Date(filterDateRange.end).toLocaleDateString("en-GB")}`
            : filter.type === "month" && filterMonth
              ? `Month: ${new Date(filterMonth + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
              : "All Entries";

        if (format === "excel") {
          exportToExcel(
            filteredEntries,
            summary,
            `${currentAccount?.name} - ${filterInfo}`,
          );
        } else if (format === "pdf-a4") {
          exportToPDF(
            filteredEntries,
            summary,
            `${currentAccount?.name} - ${filterInfo}`,
            "a4",
          );
        } else if (format === "pdf-a5") {
          exportToPDF(
            filteredEntries,
            summary,
            `${currentAccount?.name} - ${filterInfo}`,
            "a5",
          );
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      alert(`Error exporting as ${format}. Please try again.`);
    }
  };

  // Backup management functions
  const handleCreateManualBackup = () => {
    const description =
      prompt("Enter backup description (optional):") ||
      `Manual backup - ${new Date().toLocaleDateString("en-GB")}`;
    const backup = createBackup(appData, description, false);
    setBackups(getBackups());
    alert(`Backup created: ${backup.metadata.description}`);
  };

  const handleRestoreBackup = (backupId: string) => {
    if (
      confirm(
        "Are you sure you want to restore this backup? Current data will be replaced.",
      )
    ) {
      const restoredData = restoreFromBackup(backupId);
      if (restoredData) {
        setAppData(restoredData);
        alert("Backup restored successfully!");
      } else {
        alert("Failed to restore backup.");
      }
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    if (confirm("Are you sure you want to delete this backup?")) {
      deleteBackup(backupId);
      setBackups(getBackups());
    }
  };

  const handleExportBackup = (backupId: string) => {
    try {
      exportBackup(backupId);
    } catch (error) {
      alert("Failed to export backup.");
    }
  };

  const handleImportBackup = async () => {
    if (!backupFile) return;

    try {
      const backup = await importBackup(backupFile);
      setBackups(getBackups());
      setBackupFile(null);
      alert(`Backup imported: ${backup.metadata.description}`);
    } catch (error) {
      alert(`Failed to import backup: ${error}`);
    }
  };

  const filteredEntries = getFilteredEntries();
  const summary =
    filter.type === "month" && filterMonth
      ? calculateMonthlySummary(filterMonth)
      : calculateSummary(filteredEntries);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Multi-Account Ledger
                </h1>
                <p className="text-sm text-gray-600">
                  Professional Accounting System
                </p>
              </div>
            </div>

            {/* Account Switcher */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <Select
                  value={currentAccount?.id || ""}
                  onValueChange={switchAccount}
                >
                  <SelectTrigger className="w-48 border-blue-200">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {appData.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog
                open={isAccountDialogOpen}
                onOpenChange={setIsAccountDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="Enter account name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAccountDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createAccount}
                      disabled={!newAccountName.trim()}
                    >
                      Create Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "ledger" ? "default" : "ghost"}
              onClick={() => setActiveTab("ledger")}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Ledger
            </Button>
            <Button
              variant={activeTab === "goodInCart" ? "default" : "ghost"}
              onClick={() => setActiveTab("goodInCart")}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Good in Cart
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              onClick={() => setActiveTab("reports")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>
            <Button
              variant={activeTab === "accounts" ? "default" : "ghost"}
              onClick={() => setActiveTab("accounts")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Accounts
            </Button>
            <Button
              variant={activeTab === "import" ? "default" : "ghost"}
              onClick={() => setActiveTab("import")}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant={activeTab === "backups" ? "default" : "ghost"}
              onClick={() => setActiveTab("backups")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Backups
            </Button>
            <Button
              variant={activeTab === "netTotalMonth" ? "default" : "ghost"}
              onClick={() => setActiveTab("netTotalMonth")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Net Total Month
            </Button>
            <Button
              variant={activeTab === "shortcuts" ? "default" : "ghost"}
              onClick={() => setActiveTab("shortcuts")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Shortcuts
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Ledger Tab */}
        {activeTab === "ledger" && (
          <>
            {/* Entry Form */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Add New Entry - {currentAccount?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="date"
                      className="text-sm font-medium text-gray-700"
                    >
                      Date (dd/mm/yyyy)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="date"
                        type="text"
                        placeholder="25/01/2024"
                        value={formData.date}
                        onChange={(e) => {
                          // Only allow numbers and forward slashes for date
                          const value = e.target.value.replace(/[^0-9/]/g, '');
                          setFormData((prev) => ({
                            ...prev,
                            date: value,
                          }));
                        }}
                        onKeyPress={(e) => {
                          // Prevent non-numeric characters except forward slash
                          if (!/[0-9/]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                            e.preventDefault();
                          }
                        }}
                        onFocus={() => setFormFieldFocus(0)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        disabled={useCurrentDate}
                      />
                      <Button
                        type="button"
                        variant={useCurrentDate ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseCurrentDate(!useCurrentDate)}
                        className="whitespace-nowrap"
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="bill"
                      className="text-sm font-medium text-gray-700"
                    >
                      Bill Amount
                    </Label>
                    <Input
                      id="bill"
                      type="text"
                      placeholder="0"
                      value={formData.bill}
                      onChange={(e) => {
                        const formattedValue = formatNumberWithCommas(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          bill: formattedValue,
                        }));
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers, backspace, delete, and navigation keys
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                          e.preventDefault();
                        }
                      }}
                      onFocus={() => setFormFieldFocus(1)}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="cash"
                      className="text-sm font-medium text-gray-700"
                    >
                      Cash Amount
                    </Label>
                    <Input
                      id="cash"
                      type="text"
                      placeholder="0"
                      value={formData.cash}
                      onChange={(e) => {
                        const formattedValue = formatNumberWithCommas(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          cash: formattedValue,
                        }));
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers, backspace, delete, and navigation keys
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                          e.preventDefault();
                        }
                      }}
                      onFocus={() => setFormFieldFocus(2)}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Total (Auto-calculated)
                    </Label>
                    <div
                      className={cn(
                        "px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium",
                        formData.bill && formData.cash
                          ? parseFloat(removeCommas(formData.bill)) -
                              parseFloat(removeCommas(formData.cash)) <
                            0
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-gray-500",
                      )}
                    >
                      {formData.bill && formData.cash
                        ? formatCurrency(
                            parseFloat(removeCommas(formData.bill)) -
                              parseFloat(removeCommas(formData.cash)),
                          )
                        : "₹0"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-700"
                  >
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    onFocus={() => setFormFieldFocus(3)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleSaveEntry}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Add Entry
                </Button>
              </CardContent>
            </Card>

            {/* Filter Section */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filter & Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Filter Type
                    </Label>
                    <Select
                      value={filter.type}
                      onValueChange={(value: "dateRange" | "month") =>
                        setFilter({ type: value })
                      }
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dateRange">Date Range</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filter.type === "dateRange" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          value={filterDateRange.start}
                          onChange={(e) =>
                            setFilterDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={filterDateRange.end}
                          onChange={(e) =>
                            setFilterDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="border-blue-200"
                        />
                      </div>
                    </>
                  )}

                  {filter.type === "month" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Select Month
                      </Label>
                      <Input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="border-blue-200"
                      />
                    </div>
                  )}
                </div>

                {/* Summary Display */}
                <div
                  className={cn(
                    "grid gap-4 mt-6",
                    filter.type === "month"
                      ? "grid-cols-1 md:grid-cols-7"
                      : "grid-cols-1 md:grid-cols-4",
                  )}
                >
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">
                      Total Bills
                    </p>
                    <p className="text-xl font-bold text-blue-800">
                      {formatCurrency(summary.totalBills)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">
                      Total Cash
                    </p>
                    <p className="text-xl font-bold text-purple-800">
                      {formatCurrency(summary.totalCash)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "p-4 rounded-lg border",
                      summary.netType === "Profit"
                        ? "bg-green-50 border-green-200"
                        : summary.netType === "Loss"
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        summary.netType === "Profit"
                          ? "text-green-600"
                          : summary.netType === "Loss"
                            ? "text-red-600"
                            : "text-gray-600",
                      )}
                    >
                      Net {summary.netType}
                    </p>
                    <p
                      className={cn(
                        "text-xl font-bold",
                        summary.netType === "Profit"
                          ? "text-green-800"
                          : summary.netType === "Loss"
                            ? "text-red-800"
                            : "text-gray-800",
                      )}
                    >
                      {formatCurrency(Math.abs(summary.netProfitLoss))}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">
                      Total Entries
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {summary.entriesCount}
                    </p>
                  </div>

                  {/* Monthly view additional fields */}
                  {filter.type === "month" && (
                    <>
                      {/* Previous Total */}
                      {summary.previousTotal !== undefined && (
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-600 font-medium">
                            Previous Total
                          </p>
                          <p
                            className={cn(
                              "text-xl font-bold",
                              summary.previousTotal < 0
                                ? "text-green-800"
                                : "text-red-800",
                            )}
                          >
                            {summary.previousTotal < 0 ? "-" : ""}
                            {formatCurrency(Math.abs(summary.previousTotal))}
                          </p>
                        </div>
                      )}

                      {/* Current Month Total */}
                      {summary.currentMonthTotal !== undefined && (
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                          <p className="text-sm text-indigo-600 font-medium">
                            Current Month
                          </p>
                          <p
                            className={cn(
                              "text-xl font-bold",
                              summary.currentMonthTotal < 0
                                ? "text-green-800"
                                : "text-red-800",
                            )}
                          >
                            {summary.currentMonthTotal < 0 ? "-" : ""}
                            {formatCurrency(
                              Math.abs(summary.currentMonthTotal),
                            )}
                          </p>
                        </div>
                      )}

                      {/* Cumulative Total */}
                      {summary.cumulativeTotal !== undefined && (
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-sm text-emerald-600 font-medium">
                            Cumulative Total
                          </p>
                          <p
                            className={cn(
                              "text-xl font-bold",
                              summary.cumulativeTotal < 0
                                ? "text-green-800"
                                : "text-red-800",
                            )}
                          >
                            {summary.cumulativeTotal < 0 ? "-" : ""}
                            {formatCurrency(Math.abs(summary.cumulativeTotal))}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleExport("excel")}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={() => handleExport("pdf-a4")}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF (A4)
                  </Button>
                  <Button
                    onClick={() => handleExport("pdf-a5")}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF (A5)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ledger Table */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">
                  Ledger Entries ({filteredEntries.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Bill
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Cash
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Total
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          P/L
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Notes
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-gray-500"
                          >
                            No entries found for {currentAccount?.name}. Add
                            your first entry above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries
                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                          .map((entry) => (
                            <TableRow
                              key={entry.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium text-center">
                                {(entry as any).isPreviousMonthTotal
                                  ? "-"
                                  : formatDateForDisplay(entry.date)}
                              </TableCell>
                              <TableCell className="text-center">
                                {entry.bill > 0
                                  ? formatCurrency(entry.bill)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {entry.cash > 0
                                  ? formatCurrency(entry.cash)
                                  : "-"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center font-semibold",
                                  entry.total < 0
                                    ? "text-green-600"
                                    : entry.total > 0
                                      ? "text-red-600"
                                      : "text-gray-600",
                                )}
                              >
                                {entry.total === 0 &&
                                entry.bill === 0 &&
                                entry.cash === 0
                                  ? "-"
                                  : entry.total < 0
                                    ? "-" +
                                      formatCurrency(Math.abs(entry.total))
                                    : formatCurrency(Math.abs(entry.total))}
                              </TableCell>
                              <TableCell className="text-center">
                                {entry.profitLoss === "Profit" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Profit
                                  </Badge>
                                ) : entry.profitLoss === "Loss" ? (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Loss
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">-</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 max-w-32 truncate text-center">
                                {entry.notes
                                  ?.replace(
                                    /Imported from Excel on \d{2}\/\d{2}\/\d{4}/,
                                    "",
                                  )
                                  .trim() || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => handleEditEntry(entry)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Entry
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this
                                          entry? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteEntry(entry.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Accounts Tab */}
        {activeTab === "accounts" && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="h-5 w-5 text-blue-600" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appData.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          account.id === currentAccount?.id
                            ? "bg-green-500"
                            : "bg-gray-300",
                        )}
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created: {formatDateForDisplay(account.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {renameAccountId === account.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={renameAccountName}
                            onChange={(e) =>
                              setRenameAccountName(e.target.value)
                            }
                            className="w-40"
                            placeholder="New name"
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              renameAccount(account.id, renameAccountName)
                            }
                            disabled={!renameAccountName.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRenameAccountId("");
                              setRenameAccountName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRenameAccountId(account.id);
                              setRenameAccountName(account.name);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Rename
                          </Button>
                          {appData.accounts.length > 1 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Account
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {account.name}"? All associated ledger
                                    entries will be permanently deleted. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAccount(account.id)}
                                  >
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Tab */}
        {activeTab === "import" && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Upload className="h-5 w-5 text-blue-600" />
                Import from Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="importFile"
                      className="text-sm font-medium text-gray-700"
                    >
                      Select Excel File (.xlsx, .xls)
                    </Label>
                    <Input
                      id="importFile"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        setImportFile(e.target.files?.[0] || null)
                      }
                      className="border-blue-200"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportExcel}
                      disabled={!importFile || !currentAccount}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      Import to {currentAccount?.name}
                    </Button>
                    <Button
                      onClick={downloadExcelTemplate}
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Download Template
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Import Requirements:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Date format must be dd/mm/yyyy</li>
                    <li>• Required columns: Date, Bill, Cash</li>
                    <li>• Bill and Cash must be positive numbers</li>
                    <li>• Notes column is optional</li>
                    <li>• First row should contain column headers</li>
                  </ul>
                </div>
              </div>

              {importResult && (
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    importResult.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200",
                  )}
                >
                  <h4
                    className={cn(
                      "font-medium mb-2",
                      importResult.success ? "text-green-800" : "text-red-800",
                    )}
                  >
                    Import Result
                  </h4>
                  <div
                    className={cn(
                      "text-sm space-y-1",
                      importResult.success ? "text-green-700" : "text-red-700",
                    )}
                  >
                    <p>Imported: {importResult.importedCount} entries</p>
                    <p>Skipped: {importResult.skippedCount} entries</p>
                    {importResult.errors.length > 0 && (
                      <div>
                        <p className="font-medium mt-2">Errors:</p>
                        <ul className="list-disc list-inside">
                          {importResult.errors
                            .slice(0, 5)
                            .map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          {importResult.errors.length > 5 && (
                            <li>
                              ... and {importResult.errors.length - 5} more
                              errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Backups Tab */}
        {activeTab === "backups" && (
          <>
            {/* Backup Management */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Backup Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Backup Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">
                      Total Backups
                    </p>
                    <p className="text-xl font-bold text-blue-800">
                      {getBackupStats().total}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">
                      Automatic
                    </p>
                    <p className="text-xl font-bold text-green-800">
                      {getBackupStats().automatic}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">
                      Manual
                    </p>
                    <p className="text-xl font-bold text-purple-800">
                      {getBackupStats().manual}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">
                      Last Backup
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {getBackupStats().lastBackup
                        ? formatDateForDisplay(getBackupStats().lastBackup!)
                        : "Never"}
                    </p>
                  </div>
                </div>

                {/* Backup Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleCreateManualBackup}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Manual Backup
                  </Button>
                  <Button
                    onClick={() => exportCurrentDataAsBackup(appData)}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Current Data
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) =>
                        setBackupFile(e.target.files?.[0] || null)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleImportBackup}
                      disabled={!backupFile}
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Automatic Backup Info */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Automatic Backup Schedule
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Backups are automatically created every 2 days when you add
                    or modify entries. This helps ensure your data is always
                    protected.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Backup List */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">
                  Available Backups ({backups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Description
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Type
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Entries
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Accounts
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-gray-500"
                          >
                            No backups found. Create your first backup above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        backups
                          .sort(
                            (a, b) =>
                              b.metadata.timestamp.getTime() -
                              a.metadata.timestamp.getTime(),
                          )
                          .map((backup) => (
                            <TableRow
                              key={backup.metadata.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                {formatDateForDisplay(
                                  backup.metadata.timestamp,
                                )}
                              </TableCell>
                              <TableCell className="max-w-48 truncate">
                                {backup.metadata.description}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    backup.metadata.isAutomatic
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-blue-100 text-blue-800 border-blue-200"
                                  }
                                >
                                  {backup.metadata.isAutomatic
                                    ? "Auto"
                                    : "Manual"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {backup.metadata.entryCount}
                              </TableCell>
                              <TableCell className="text-center">
                                {backup.metadata.accountCount}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() =>
                                      handleRestoreBackup(backup.metadata.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                    title="Restore"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleExportBackup(backup.metadata.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                    title="Export"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleDeleteBackup(backup.metadata.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Good in Cart Tab */}
        {activeTab === "goodInCart" && (
          <>
            {/* Good in Cart Entry Form */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Add Good in Cart - {currentAccount?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="gicDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Date (dd/mm/yyyy)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="gicDate"
                        type="text"
                        placeholder="25/01/2024"
                        value={goodInCartForm.date}
                        onChange={(e) =>
                          setGoodInCartForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        disabled={useCurrentDateGIC}
                      />
                      <Button
                        type="button"
                        variant={useCurrentDateGIC ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseCurrentDateGIC(!useCurrentDateGIC)}
                        className="whitespace-nowrap"
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="gicValue"
                      className="text-sm font-medium text-gray-700"
                    >
                      Good in Cart Value (X)
                    </Label>
                    <Input
                      id="gicValue"
                      type="number"
                      placeholder="0"
                      value={goodInCartForm.value}
                      onChange={(e) =>
                        setGoodInCartForm((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="gicNotes"
                      className="text-sm font-medium text-gray-700"
                    >
                      Notes
                    </Label>
                    <Input
                      id="gicNotes"
                      type="text"
                      value={goodInCartForm.notes}
                      onChange={(e) =>
                        setGoodInCartForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveGICEntry}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Add Good in Cart Entry
                </Button>
              </CardContent>
            </Card>

            {/* Good in Cart Entries List */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-gray-800">
                  Good in Cart Entries ({getCurrentAccountGICEntries().length}{" "}
                  entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Value (X)
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Notes
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentAccountGICEntries().length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            No Good in Cart entries found for{" "}
                            {currentAccount?.name}. Add your first entry above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCurrentAccountGICEntries()
                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                          .map((entry) => (
                            <TableRow
                              key={entry.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                {formatDateForDisplay(entry.date)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-700">
                                {formatCurrency(entry.value)}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {entry.notes || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => handleEditGICEntry(entry)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Good in Cart Entry
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this
                                          Good in Cart entry? This action cannot
                                          be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteGICEntry(entry.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <>
            {/* Good in Cart Filter */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Good in Cart Report Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Start Date (Auto-filled)
                    </Label>
                    <Input
                      type="date"
                      value={gicFilterStartDate}
                      readOnly
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      End Date (Process Complete Date)
                    </Label>
                    <Select
                      value={gicFilterEndDate}
                      onValueChange={handleGICEndDateChange}
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select process end date" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrentAccountGICEntries()
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map((entry) => {
                            // Calculate the end date of the process (next day after this entry)
                            const processEndDate = new Date(entry.date);
                            processEndDate.setDate(
                              processEndDate.getDate() + 1,
                            );
                            return (
                              <SelectItem
                                key={entry.id}
                                value={entry.date.toISOString().split("T")[0]}
                              >
                                Process End:{" "}
                                {formatDateForDisplay(processEndDate)} (Value:{" "}
                                {formatCurrency(entry.value)})
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {getCurrentAccountGICEntries().length === 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      No Good in Cart entries found. Please add some entries in
                      the "Good in Cart" tab first.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Good in Cart Report Results */}
            {gicReport && (
              <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-gray-800">
                      Good in Cart Report (
                      {formatDateForDisplay(gicReport.startDate)} to{" "}
                      {formatDateForDisplay(gicReport.endDate)})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExport("excel")}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button
                        onClick={() => handleExport("pdf-a4")}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF (A4)
                      </Button>
                      <Button
                        onClick={() => handleExport("pdf-a5")}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF (A5)
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Overall Summary */}
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Start X Value</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(gicReport.startX)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">End X Value</p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatCurrency(gicReport.endX)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Overall {gicReport.overallPL}
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            gicReport.overallPL === "Profit"
                              ? "text-green-600"
                              : gicReport.overallPL === "Loss"
                                ? "text-red-600"
                                : "text-gray-600",
                          )}
                        >
                          {formatCurrency(Math.abs(gicReport.overallTotal))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Report Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            Date
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            Bill
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            Cash
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            Total
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            P/L
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            Notes
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gicReport.reportRows
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map((row) => (
                            <TableRow
                              key={row.id}
                              className={cn(
                                "hover:bg-gray-50",
                                row.isGoodInCart &&
                                  "bg-blue-50/50 font-medium border-l-4 border-blue-400",
                              )}
                            >
                              <TableCell className="font-medium text-center">
                                {formatDateForDisplay(row.date)}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.bill > 0 ? formatCurrency(row.bill) : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.cash > 0 ? formatCurrency(row.cash) : "-"}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-center font-semibold",
                                  row.total < 0
                                    ? "text-green-600"
                                    : row.total > 0
                                      ? "text-red-600"
                                      : "text-gray-600",
                                )}
                              >
                                {formatCurrency(Math.abs(row.total))}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.profitLoss === "Good in Cart" ? (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 italic">
                                    गाड़ी में सामान
                                  </Badge>
                                ) : row.profitLoss === "Profit" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Profit
                                  </Badge>
                                ) : row.profitLoss === "Loss" ? (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Loss
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">-</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 max-w-32 truncate text-center">
                                {row.notes
                                  ?.replace(
                                    /Imported from Excel on \d{2}\/\d{2}\/\d{4}/,
                                    "",
                                  )
                                  .trim() || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Net Total Month Tab */}
        {activeTab === "netTotalMonth" && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5 text-blue-600" />
                Net Total by Month - {currentAccount?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Year
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Month
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Net Total
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Previous Total
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Cumulative Total
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Entries Count
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Type
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      if (!currentAccount) return [];

                      // Get all unique year-month combinations for current account
                      const uniqueMonths = new Set<string>();
                      getCurrentAccountEntries().forEach((entry) => {
                        const year = entry.date.getFullYear();
                        const month = entry.date.getMonth();
                        uniqueMonths.add(`${year}-${month}`);
                      });

                      // Convert to array and sort by year-month
                      const sortedMonths = Array.from(uniqueMonths)
                        .map((monthKey) => {
                          const [year, month] = monthKey.split("-").map(Number);
                          return { year, month };
                        })
                        .sort((a, b) => {
                          if (a.year !== b.year) return a.year - b.year;
                          return a.month - b.month;
                        });

                      if (sortedMonths.length === 0) {
                        return (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-gray-500"
                            >
                              No entries found for {currentAccount?.name}. Add
                              some entries to see monthly totals.
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return sortedMonths.map(({ year, month }) => {
                        const monthNetTotal = getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const previousTotal = getAllPreviousMonthsTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const cumulativeTotal = previousTotal + monthNetTotal;
                        const monthEntries = getCurrentAccountEntries().filter(
                          (entry) =>
                            entry.date.getFullYear() === year &&
                            entry.date.getMonth() === month,
                        );
                        const entriesCount = monthEntries.length;
                        const netType =
                          monthNetTotal < 0
                            ? "Profit"
                            : monthNetTotal > 0
                              ? "Loss"
                              : "Break-even";
                        const monthName = new Date(
                          year,
                          month,
                          1,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });

                        return (
                          <TableRow
                            key={`${year}-${month}`}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="text-center font-medium">
                              {year}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {monthName}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center font-semibold",
                                monthNetTotal < 0
                                  ? "text-green-600"
                                  : monthNetTotal > 0
                                    ? "text-red-600"
                                    : "text-gray-600",
                              )}
                            >
                              {monthNetTotal === 0
                                ? "-"
                                : monthNetTotal < 0
                                  ? "-" +
                                    formatCurrency(Math.abs(monthNetTotal))
                                  : formatCurrency(Math.abs(monthNetTotal))}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center font-medium",
                                previousTotal < 0
                                  ? "text-green-600"
                                  : previousTotal > 0
                                    ? "text-red-600"
                                    : "text-gray-600",
                              )}
                            >
                              {previousTotal === 0
                                ? "-"
                                : previousTotal < 0
                                  ? "-" +
                                    formatCurrency(Math.abs(previousTotal))
                                  : formatCurrency(Math.abs(previousTotal))}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-center font-bold",
                                cumulativeTotal < 0
                                  ? "text-green-600"
                                  : cumulativeTotal > 0
                                    ? "text-red-600"
                                    : "text-gray-600",
                              )}
                            >
                              {cumulativeTotal === 0
                                ? "-"
                                : cumulativeTotal < 0
                                  ? "-" +
                                    formatCurrency(Math.abs(cumulativeTotal))
                                  : formatCurrency(Math.abs(cumulativeTotal))}
                            </TableCell>
                            <TableCell className="text-center">
                              {entriesCount}
                            </TableCell>
                            <TableCell className="text-center">
                              {netType === "Profit" ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Profit
                                </Badge>
                              ) : netType === "Loss" ? (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Loss
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Break-even</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>

              {/* Export Buttons for Net Total Month */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 mt-6">
                <Button
                  onClick={() => {
                    if (!currentAccount) return;
                    // Create export data for monthly totals
                    const uniqueMonths = new Set<string>();
                    getCurrentAccountEntries().forEach((entry) => {
                      const year = entry.date.getFullYear();
                      const month = entry.date.getMonth();
                      uniqueMonths.add(`${year}-${month}`);
                    });

                    const sortedMonths = Array.from(uniqueMonths)
                      .map((monthKey) => {
                        const [year, month] = monthKey.split("-").map(Number);
                        return { year, month };
                      })
                      .sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.month - b.month;
                      });

                    const exportEntries = sortedMonths.map(
                      ({ year, month }) => {
                        const monthNetTotal = getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const previousTotal = getCumulativeNetTotal(
                          appData,
                          year,
                          month - 1,
                          currentAccount.id,
                        );
                        const cumulativeTotal = getCumulativeNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const monthName = new Date(
                          year,
                          month,
                          1,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });

                        return {
                          id: `${year}-${month}`,
                          date: new Date(year, month, 1),
                          bill: monthNetTotal > 0 ? monthNetTotal : 0,
                          cash: monthNetTotal < 0 ? Math.abs(monthNetTotal) : 0,
                          total: monthNetTotal,
                          profitLoss:
                            monthNetTotal < 0
                              ? "Profit"
                              : monthNetTotal > 0
                                ? "Loss"
                                : "",
                          notes: `${monthName} - Previous: ${formatCurrency(Math.abs(previousTotal))}, Cumulative: ${formatCurrency(Math.abs(cumulativeTotal))}`,
                          accountId: currentAccount.id,
                        } as LedgerEntry;
                      },
                    );

                    const totalNetProfit = sortedMonths.reduce(
                      (sum, { year, month }) =>
                        sum +
                        getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        ),
                      0,
                    );

                    const summary = {
                      totalBills: sortedMonths.reduce(
                        (sum, { year, month }) => {
                          const net = getMonthlyNetTotal(
                            appData,
                            year,
                            month,
                            currentAccount.id,
                          );
                          return sum + (net > 0 ? net : 0);
                        },
                        0,
                      ),
                      totalCash: sortedMonths.reduce((sum, { year, month }) => {
                        const net = getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        return sum + (net < 0 ? Math.abs(net) : 0);
                      }, 0),
                      netProfitLoss: totalNetProfit,
                      netType:
                        totalNetProfit < 0
                          ? "Profit"
                          : totalNetProfit > 0
                            ? "Loss"
                            : "Break-even",
                      entriesCount: sortedMonths.length,
                    } as LedgerSummary;

                    exportToExcel(
                      exportEntries,
                      summary,
                      `${currentAccount.name} - Net Total by Month`,
                    );
                  }}
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  onClick={() => {
                    if (!currentAccount) return;
                    // Similar export logic for PDF
                    const uniqueMonths = new Set<string>();
                    getCurrentAccountEntries().forEach((entry) => {
                      const year = entry.date.getFullYear();
                      const month = entry.date.getMonth();
                      uniqueMonths.add(`${year}-${month}`);
                    });

                    const sortedMonths = Array.from(uniqueMonths)
                      .map((monthKey) => {
                        const [year, month] = monthKey.split("-").map(Number);
                        return { year, month };
                      })
                      .sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.month - b.month;
                      });

                    const exportEntries = sortedMonths.map(
                      ({ year, month }) => {
                        const monthNetTotal = getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const previousTotal = getCumulativeNetTotal(
                          appData,
                          year,
                          month - 1,
                          currentAccount.id,
                        );
                        const cumulativeTotal = getCumulativeNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        const monthName = new Date(
                          year,
                          month,
                          1,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });

                        return {
                          id: `${year}-${month}`,
                          date: new Date(year, month, 1),
                          bill: monthNetTotal > 0 ? monthNetTotal : 0,
                          cash: monthNetTotal < 0 ? Math.abs(monthNetTotal) : 0,
                          total: monthNetTotal,
                          profitLoss:
                            monthNetTotal < 0
                              ? "Profit"
                              : monthNetTotal > 0
                                ? "Loss"
                                : "",
                          notes: `${monthName} - Previous: ${formatCurrency(Math.abs(previousTotal))}, Cumulative: ${formatCurrency(Math.abs(cumulativeTotal))}`,
                          accountId: currentAccount.id,
                        } as LedgerEntry;
                      },
                    );

                    const totalNetProfit = sortedMonths.reduce(
                      (sum, { year, month }) =>
                        sum +
                        getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        ),
                      0,
                    );

                    const summary = {
                      totalBills: sortedMonths.reduce(
                        (sum, { year, month }) => {
                          const net = getMonthlyNetTotal(
                            appData,
                            year,
                            month,
                            currentAccount.id,
                          );
                          return sum + (net > 0 ? net : 0);
                        },
                        0,
                      ),
                      totalCash: sortedMonths.reduce((sum, { year, month }) => {
                        const net = getMonthlyNetTotal(
                          appData,
                          year,
                          month,
                          currentAccount.id,
                        );
                        return sum + (net < 0 ? Math.abs(net) : 0);
                      }, 0),
                      netProfitLoss: totalNetProfit,
                      netType:
                        totalNetProfit < 0
                          ? "Profit"
                          : totalNetProfit > 0
                            ? "Loss"
                            : "Break-even",
                      entriesCount: sortedMonths.length,
                    } as LedgerSummary;

                    exportToPDF(
                      exportEntries,
                      summary,
                      `${currentAccount.name} - Net Total by Month`,
                      "a4",
                    );
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF (A4)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shortcuts Tab */}
        {activeTab === "shortcuts" && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Settings className="h-5 w-5 text-blue-600" />
                Keyboard Shortcuts Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shortcuts Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <h3 className="font-medium text-blue-800">Keyboard Shortcuts Active</h3>
                  <p className="text-sm text-blue-600">
                    Use Ctrl+Arrow keys for form navigation and number keys for tab switching
                  </p>
                </div>
              </div>

              {/* Essential Shortcuts */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Essential Keyboard Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Tab Navigation</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Key 1:</span>
                        <span className="font-mono">Ledger</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key 2:</span>
                        <span className="font-mono">Good in Cart</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key 3:</span>
                        <span className="font-mono">Reports</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key 4:</span>
                        <span className="font-mono">Shortcuts</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Entry Form (Ledger Tab)</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Enter:</span>
                        <span className="font-mono">Submit Entry</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ctrl + ← →:</span>
                        <span className="font-mono">Navigate Fields</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Field Order: Date → Bill → Cash → Notes
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Date field: Only numbers and "/" allowed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">How to Use Keyboard Shortcuts</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Number Keys (1-4):</strong> Jump directly to main tabs</li>
                  <li>• <strong>Enter Key:</strong> Submit entry when in Ledger tab</li>
                  <li>• <strong>Ctrl + Arrow Keys (← →):</strong> Navigate between form fields in Ledger</li>
                  <li>• <strong>Date Field:</strong> Only accepts numbers and "/" character</li>
                  <li>• <strong>Status:</strong> <span className="text-green-600 font-semibold">Keyboard navigation is ALWAYS ACTIVE</span></li>
                </ul>
              </div>


            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDate">Date (dd/mm/yyyy)</Label>
                <Input
                  id="editDate"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  placeholder="25/01/2024"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant={useCurrentDate ? "default" : "outline"}
                  onClick={() => setUseCurrentDate(!useCurrentDate)}
                  className="w-full"
                >
                  Use Current Date
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editBill">Bill Amount</Label>
                <Input
                  id="editBill"
                  type="text"
                  value={formData.bill}
                  onChange={(e) => {
                    const formattedValue = formatNumberWithCommas(e.target.value);
                    setFormData((prev) => ({ ...prev, bill: formattedValue }));
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="editCash">Cash Amount</Label>
                <Input
                  id="editCash"
                  type="text"
                  value={formData.cash}
                  onChange={(e) => {
                    const formattedValue = formatNumberWithCommas(e.target.value);
                    setFormData((prev) => ({ ...prev, cash: formattedValue }));
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Enter notes..."
                rows={3}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Total: </p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  formData.bill && formData.cash
                    ? parseFloat(removeCommas(formData.bill)) - parseFloat(removeCommas(formData.cash)) < 0
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-500",
                )}
              >
                {formData.bill && formData.cash
                  ? formatCurrency(
                      parseFloat(formData.bill) - parseFloat(formData.cash),
                    )
                  : "��0"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEntry(null);
                setFormData({
                  date: getCurrentDateString(),
                  bill: "",
                  cash: "",
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEntry}>Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Good in Cart Entry Dialog */}
      <Dialog open={isGICEditDialogOpen} onOpenChange={setIsGICEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Good in Cart Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editGICDate">Date (dd/mm/yyyy)</Label>
                <Input
                  id="editGICDate"
                  value={goodInCartForm.date}
                  onChange={(e) =>
                    setGoodInCartForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  placeholder="25/01/2024"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant={useCurrentDateGIC ? "default" : "outline"}
                  onClick={() => setUseCurrentDateGIC(!useCurrentDateGIC)}
                  className="w-full"
                >
                  Use Current Date
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="editGICValue">Good in Cart Value (X)</Label>
              <Input
                id="editGICValue"
                type="number"
                value={goodInCartForm.value}
                onChange={(e) =>
                  setGoodInCartForm((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="editGICNotes">Notes</Label>
              <Input
                id="editGICNotes"
                value={goodInCartForm.notes}
                onChange={(e) =>
                  setGoodInCartForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="ग���ड़ी में सामान"
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Value: </p>
              <p className="text-lg font-semibold text-blue-600">
                {goodInCartForm.value
                  ? formatCurrency(parseFloat(goodInCartForm.value))
                  : "₹0"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsGICEditDialogOpen(false);
                setEditingGICEntry(null);
                setGoodInCartForm({
                  date: getCurrentDateString(),
                  value: "",
                  notes: "गाड़ी म���ं सामान",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGICEntry}>Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
