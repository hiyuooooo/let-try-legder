export interface LedgerEntry {
  id: string;
  date: Date;
  bill: number;
  cash: number;
  total: number;
  profitLoss: "Profit" | "Loss" | "" | "गाड़ी में सामान";
  notes?: string;
  accountId: string;
}

export interface GoodInCartEntry {
  id: string;
  date: Date;
  value: number; // X value
  notes?: string;
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface LedgerSummary {
  totalBills: number;
  totalCash: number;
  netProfitLoss: number;
  netType: "Profit" | "Loss" | "Break-even";
  entriesCount: number;
  previousTotal?: number; // Previous cumulative total (up to previous month)
  currentMonthTotal?: number; // Current month net total only
  cumulativeTotal?: number; // Full cumulative total (current + previous)
  isMonthlyView?: boolean; // Flag to indicate if this is a monthly view
}

export interface FilterOptions {
  type: "dateRange" | "month" | "goodInCart";
  startDate?: Date;
  endDate?: Date;
  month?: string; // YYYY-MM format
  goodInCartStartDate?: Date;
  goodInCartEndDate?: Date;
}

export interface GoodInCartReportRow {
  id: string;
  date: Date;
  bill: number;
  cash: number;
  total: number;
  profitLoss: "Profit" | "Loss" | "" | "Good in Cart";
  notes?: string;
  isGoodInCart?: boolean;
  isLedgerEntry?: boolean;
}

export interface GoodInCartReport {
  reportRows: GoodInCartReportRow[];
  overallTotal: number;
  overallPL: "Profit" | "Loss" | "Break-even";
  startDate: Date;
  endDate: Date;
  startX: number;
  endX: number;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface MonthlyNetTotal {
  year: number;
  month: number; // 0-11 (January = 0)
  accountId: string;
  netTotal: number;
  entriesCount: number;
  lastUpdated: Date;
}

export interface AppData {
  accounts: Account[];
  ledgerEntries: LedgerEntry[];
  goodInCartEntries: GoodInCartEntry[];
  currentAccountId: string;
  lastUsedDates: Record<string, string>; // accountId -> last used date
  monthlyNetTotals: MonthlyNetTotal[]; // Cache for monthly calculations
}

export type ExportFormat = "excel" | "pdf-a4" | "pdf-a5";
export type NavigationTab = "ledger" | "goodInCart" | "reports" | "settings";
