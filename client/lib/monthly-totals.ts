import { AppData, LedgerEntry, MonthlyNetTotal } from "@shared/types";

// Generate a unique key for a month
export const getMonthKey = (
  year: number,
  month: number,
  accountId: string,
): string => {
  return `${year}-${month.toString().padStart(2, "0")}-${accountId}`;
};

// Calculate net total for a specific month
export const calculateMonthNetTotal = (
  entries: LedgerEntry[],
  year: number,
  month: number,
  accountId: string,
): MonthlyNetTotal => {
  const monthEntries = entries.filter(
    (entry) =>
      entry.accountId === accountId &&
      entry.date.getFullYear() === year &&
      entry.date.getMonth() === month,
  );

  const netTotal = monthEntries.reduce((sum, entry) => sum + entry.total, 0);

  return {
    year,
    month,
    accountId,
    netTotal,
    entriesCount: monthEntries.length,
    lastUpdated: new Date(),
  };
};

// Update or create monthly net total
export const updateMonthlyNetTotal = (
  appData: AppData,
  year: number,
  month: number,
  accountId: string,
): AppData => {
  const newMonthlyTotal = calculateMonthNetTotal(
    appData.ledgerEntries,
    year,
    month,
    accountId,
  );

  const existingIndex = appData.monthlyNetTotals.findIndex(
    (total) =>
      total.year === year &&
      total.month === month &&
      total.accountId === accountId,
  );

  let updatedMonthlyNetTotals;
  if (existingIndex >= 0) {
    // Update existing
    updatedMonthlyNetTotals = [...appData.monthlyNetTotals];
    updatedMonthlyNetTotals[existingIndex] = newMonthlyTotal;
  } else {
    // Add new
    updatedMonthlyNetTotals = [...appData.monthlyNetTotals, newMonthlyTotal];
  }

  return {
    ...appData,
    monthlyNetTotals: updatedMonthlyNetTotals,
  };
};

// Get monthly net total from cache or calculate if not exists
export const getMonthlyNetTotal = (
  appData: AppData,
  year: number,
  month: number,
  accountId: string,
): number => {
  const cached = appData.monthlyNetTotals.find(
    (total) =>
      total.year === year &&
      total.month === month &&
      total.accountId === accountId,
  );

  if (cached) {
    return cached.netTotal;
  }

  // Calculate if not cached
  const calculated = calculateMonthNetTotal(
    appData.ledgerEntries,
    year,
    month,
    accountId,
  );

  return calculated.netTotal;
};

// Get cumulative total from January to specified month (inclusive)
export const getCumulativeNetTotal = (
  appData: AppData,
  year: number,
  month: number,
  accountId: string,
): number => {
  let cumulativeTotal = 0;

  for (let m = 0; m <= month; m++) {
    cumulativeTotal += getMonthlyNetTotal(appData, year, m, accountId);
  }

  return cumulativeTotal;
};

// Get cumulative total from ALL previous months across ALL years up to (but not including) specified month
export const getAllPreviousMonthsTotal = (
  appData: AppData,
  year: number,
  month: number,
  accountId: string,
): number => {
  let cumulativeTotal = 0;

  // Get all unique year-month combinations for this account
  const uniqueMonths = new Set<string>();
  appData.ledgerEntries
    .filter((entry) => entry.accountId === accountId)
    .forEach((entry) => {
      const entryYear = entry.date.getFullYear();
      const entryMonth = entry.date.getMonth();

      // Only include months before the specified month
      if (entryYear < year || (entryYear === year && entryMonth < month)) {
        uniqueMonths.add(`${entryYear}-${entryMonth}`);
      }
    });

  // Calculate total for all previous months
  Array.from(uniqueMonths).forEach((monthKey) => {
    const [monthYear, monthIndex] = monthKey.split("-").map(Number);
    cumulativeTotal += getMonthlyNetTotal(
      appData,
      monthYear,
      monthIndex,
      accountId,
    );
  });

  return cumulativeTotal;
};

// Update all monthly totals for an account when entries change
export const updateAllMonthlyTotalsForAccount = (
  appData: AppData,
  accountId: string,
): AppData => {
  // Get all unique year-month combinations for this account
  const uniqueMonths = new Set<string>();

  appData.ledgerEntries
    .filter((entry) => entry.accountId === accountId)
    .forEach((entry) => {
      const year = entry.date.getFullYear();
      const month = entry.date.getMonth();
      uniqueMonths.add(`${year}-${month}`);
    });

  let updatedAppData = { ...appData };

  // Update totals for each unique month
  Array.from(uniqueMonths).forEach((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    updatedAppData = updateMonthlyNetTotal(
      updatedAppData,
      year,
      month,
      accountId,
    );
  });

  return updatedAppData;
};

// Clean up old monthly totals (older than 2 years)
export const cleanupOldMonthlyTotals = (appData: AppData): AppData => {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const filteredTotals = appData.monthlyNetTotals.filter((total) => {
    const totalDate = new Date(total.year, total.month, 1);
    return totalDate >= twoYearsAgo;
  });

  return {
    ...appData,
    monthlyNetTotals: filteredTotals,
  };
};
