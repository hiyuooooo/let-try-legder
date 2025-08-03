import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { LedgerEntry, LedgerSummary } from "@shared/types";
import { setupHindiFonts, formatTextForPDF } from "./pdf-fonts";

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format currency for PDF (without currency symbol to avoid encoding issues)
export const formatCurrencyForPDF = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date as dd/mm/yyyy
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-GB");
};

// Export to Excel
export const exportToExcel = (
  entries: LedgerEntry[],
  summary: LedgerSummary,
  filterInfo: string,
) => {
  // Clean notes function to remove import text
  const cleanNotes = (notes?: string): string => {
    if (!notes) return "";
    return notes
      .replace(/Imported from Excel on \d{2}\/\d{2}\/\d{4}/, "")
      .trim();
  };
  // Prepare data for Excel
  const summaryRows = [
    ["Total Bills:", summary.totalBills.toLocaleString("en-IN")],
    ["Total Cash:", summary.totalCash.toLocaleString("en-IN")],
    [
      `Net ${summary.netType}:`,
      summary.netProfitLoss < 0
        ? `-${Math.abs(summary.netProfitLoss).toLocaleString("en-IN")}`
        : Math.abs(summary.netProfitLoss).toLocaleString("en-IN"),
    ],
    ["Total Entries:", summary.entriesCount],
  ];

  // Add monthly view specific totals with minus signs
  if (summary.isMonthlyView) {
    if (summary.previousTotal !== undefined) {
      const prevTotalText =
        summary.previousTotal < 0
          ? `-${Math.abs(summary.previousTotal).toLocaleString("en-IN")}`
          : Math.abs(summary.previousTotal).toLocaleString("en-IN");
      summaryRows.push(["Previous Total:", prevTotalText]);
    }
    if (summary.currentMonthTotal !== undefined) {
      const currentTotalText =
        summary.currentMonthTotal < 0
          ? `-${Math.abs(summary.currentMonthTotal).toLocaleString("en-IN")}`
          : Math.abs(summary.currentMonthTotal).toLocaleString("en-IN");
      summaryRows.push(["Current Month Total:", currentTotalText]);
    }
    if (summary.cumulativeTotal !== undefined) {
      const cumulativeTotalText =
        summary.cumulativeTotal < 0
          ? `-Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`
          : `Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`;
      summaryRows.push(["Cumulative Total:", cumulativeTotalText + " bakyya"]);
    }
  }

  const excelData = [
    ["Ledger Report"],
    [filterInfo],
    [], // Empty row
    ["Summary"],
    ...summaryRows,
    [], // Empty row
    ["Date", "Bill", "Cash", "Total", "P/L", "Notes"], // Headers
    ...entries.map((entry) => [
      formatDate(entry.date),
      entry.bill > 0 ? entry.bill.toLocaleString("en-IN") : "",
      entry.cash > 0 ? entry.cash.toLocaleString("en-IN") : "",
      entry.total < 0
        ? `-${Math.abs(entry.total).toLocaleString("en-IN")}`
        : entry.total.toLocaleString("en-IN"),
      entry.profitLoss || "",
      cleanNotes(entry.notes) || "",
    ]),
  ];

  // Add bottom summary section matching PDF template
  if (summary.isMonthlyView) {
    excelData.push([]); // Empty row
    excelData.push([
      "Total",
      summary.totalBills.toLocaleString("en-IN"),
      summary.totalCash.toLocaleString("en-IN"),
      (summary.currentMonthTotal || summary.netProfitLoss).toString(),
    ]);

    if (summary.previousTotal !== undefined) {
      const prevText =
        summary.previousTotal < 0
          ? `-${Math.abs(summary.previousTotal)}`
          : summary.previousTotal.toString();
      excelData.push(["", "", "Previous Total", prevText]);
    }

    if (summary.cumulativeTotal !== undefined) {
      const cumulativeText =
        summary.cumulativeTotal < 0
          ? `-Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`
          : `Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`;
      excelData.push(["bakyya", "", "Cumulative Total", cumulativeText]);
    }
  }

  // Create workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const wb = XLSX.utils.book_new();

  // Style the header rows
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  // Style title (row 1)
  if (ws["A1"]) {
    ws["A1"].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: "center" },
    };
  }

  // Style summary section (dynamically handle rows)
  const summaryStartRow = 3; // Row 4 in 0-based indexing
  const summaryRowCount =
    summary.isMonthlyView && summary.previousTotal !== undefined ? 5 : 4;
  const summaryEndRow = summaryStartRow + summaryRowCount - 1;

  for (let row = summaryStartRow; row <= summaryEndRow; row++) {
    for (let col = 0; col <= 1; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) {
        // Check if this is the Previous Total row (last row in summary)
        const isPreviousTotalRow =
          row === summaryEndRow && summary.isMonthlyView;

        ws[cellAddress].s = {
          font: {
            bold: col === 0 || isPreviousTotalRow,
            sz: isPreviousTotalRow ? 14 : 12, // Bigger size for Previous Total
          },
          fill: { fgColor: { rgb: isPreviousTotalRow ? "FFF2CC" : "F0F8FF" } }, // Yellow for Previous Total
        };
      }
    }
  }

  // Style data headers (adjust row number based on summary)
  const headerRowIndex = summaryStartRow + summaryRowCount + 1; // After summary + empty row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col }); // Header row
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "EFEFEF" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }
  }

  // Set column widths
  ws["!cols"] = [
    { width: 12 }, // Date
    { width: 12 }, // Bill
    { width: 12 }, // Cash
    { width: 12 }, // Total
    { width: 10 }, // P/L
    { width: 30 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");

  // Save the Excel file
  const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
  XLSX.writeFile(wb, `ledger-report-${today}.xlsx`);
};

// Clean notes function to remove import text
const cleanNotes = (notes?: string): string => {
  if (!notes) return "";
  return notes.replace(/Imported from Excel on \d{2}\/\d{2}\/\d{4}/, "").trim();
};

// Export to PDF - Professional style matching the provided template
export const exportToPDF = (
  entries: LedgerEntry[],
  summary: LedgerSummary,
  filterInfo: string,
  format: "a4" | "a5" = "a4",
) => {
  try {
    console.log("PDF Export - Starting with data:", {
      entries: entries.length,
      summary,
      filterInfo,
    });
    const doc = new jsPDF("p", "mm", format);
    const pageWidth = format === "a4" ? 210 : 148;
    const pageHeight = format === "a4" ? 297 : 210;
    const margin = 15;

    let yPos = margin + 5;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Ledger Report", margin, yPos);
    yPos += 15;

    // Account and filter info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(filterInfo, margin, yPos);
    yPos += 10;

    // Summary section title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, yPos);
    yPos += 8;

    // Summary data with tighter spacing
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Compact summary layout
    doc.text(
      `Total Bills: ${summary.totalBills.toLocaleString("en-IN")}`,
      margin,
      yPos,
    );
    yPos += 4;
    doc.text(
      `Total Cash: ${summary.totalCash.toLocaleString("en-IN")}`,
      margin,
      yPos,
    );
    yPos += 4;

    const netText = summary.netProfitLoss < 0 ? "Net Profit:" : "Net Loss:";
    doc.text(
      `${netText} ${Math.abs(summary.netProfitLoss).toLocaleString("en-IN")}`,
      margin,
      yPos,
    );
    yPos += 4;
    doc.text(`Total Entries: ${summary.entriesCount}`, margin, yPos);
    yPos += 4;

    // Add monthly view specific totals with tight spacing
    if (summary.isMonthlyView && summary.previousTotal !== undefined) {
      const prevText =
        summary.previousTotal < 0
          ? `-${Math.abs(summary.previousTotal)}`
          : summary.previousTotal.toString();
      doc.text(`Previous Total:${prevText}`, margin, yPos);
      yPos += 4;
    }

    if (summary.isMonthlyView && summary.currentMonthTotal !== undefined) {
      const currentMonthText =
        summary.currentMonthTotal < 0
          ? `-${Math.abs(summary.currentMonthTotal)}`
          : summary.currentMonthTotal.toString();
      doc.text(`Current Month:${currentMonthText}`, margin, yPos);
      yPos += 4;
    }

    if (summary.isMonthlyView && summary.cumulativeTotal !== undefined) {
      const cumulativeText =
        summary.cumulativeTotal < 0
          ? `-Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`
          : `Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`;
      doc.text(`Cumulative Total:${cumulativeText} bakyya`, margin, yPos);
      yPos += 4;
    }

    // Cumulative Total (if available)
    if (summary.isMonthlyView && summary.cumulativeTotal !== undefined) {
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const cumulativeText =
        summary.cumulativeTotal < 0
          ? `-${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`
          : `${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`;
      doc.text("Cumulative", margin, yPos);
      yPos += 6;
      doc.text(`Total: ${cumulativeText} bakyya`, margin + 10, yPos);
    }

    yPos += 15;

    // Table setup - more horizontal spacing for better readability
    const colWidths =
      format === "a4" ? [35, 35, 35, 35, 25] : [25, 26, 26, 26, 20];
    const headers = ["Date", "Bill", "Cash", "Total", "P/L"];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

    // Table header with dark background
    doc.setFillColor(70, 70, 70); // Dark gray background
    doc.rect(margin, yPos, tableWidth, 8, "F");

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    // Draw header cells with borders and proper alignment
    let xPos = margin;
    headers.forEach((header, i) => {
      // Draw border for header cell
      doc.setDrawColor(70, 70, 70);
      doc.rect(xPos, yPos, colWidths[i], 8);

      // Right align Bill, Cash, Total columns (1, 2, 3)
      if (i >= 1 && i <= 3) {
        doc.text(header, xPos + colWidths[i] - 3, yPos + 5, { align: "right" });
      } else {
        doc.text(header, xPos + 2, yPos + 5);
      }
      xPos += colWidths[i];
    });
    yPos += 8;

    // Reset for table data
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Table data with alternating row colors
    entries.forEach((entry, index) => {
      // Check for new page
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;

        // Redraw header
        doc.setFillColor(70, 70, 70);
        doc.rect(margin, yPos, tableWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        xPos = margin;
        headers.forEach((header, i) => {
          doc.text(header, xPos + 2, yPos + 5);
          xPos += colWidths[i];
        });
        yPos += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      // Alternating row background with borders
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos, tableWidth, 8, "F");
      }

      // Draw row borders
      doc.setDrawColor(200, 200, 200);
      xPos = margin;
      headers.forEach((header, i) => {
        doc.rect(xPos, yPos, colWidths[i], 8);
        xPos += colWidths[i];
      });

      xPos = margin;

      // Handle Hindi text for "गाड़ी में सामान" - clean up any strange characters
      let profitLossText = entry.profitLoss || "-";
      if (
        entry.profitLoss === "गाड़ी में सामान" ||
        entry.profitLoss?.includes("गा���़ी")
      ) {
        profitLossText = "गाड़�� में सामान"; // Keep as clean Devanagari
      }
      // Remove any strange characters like !, <, @, ., G, 8, >, .
      profitLossText = profitLossText.replace(/[!<@.G8>.]/g, "");

      // Format amounts without ¹ symbol - use plain numbers
      const billText = entry.bill > 0 ? formatCurrencyForPDF(entry.bill) : "-";
      const cashText = entry.cash > 0 ? formatCurrencyForPDF(entry.cash) : "-";

      // Total with proper minus sign if negative
      let totalText;
      if (entry.total < 0) {
        totalText = "-" + formatCurrencyForPDF(Math.abs(entry.total));
      } else {
        totalText = formatCurrencyForPDF(Math.abs(entry.total));
      }

      // Date
      doc.text(formatDate(entry.date), xPos + 2, yPos + 6);
      xPos += colWidths[0];

      // Bill (right aligned)
      const bill = entry.bill > 0 ? entry.bill.toLocaleString("en-IN") : "";
      if (bill) {
        doc.text(bill, xPos + colWidths[1] - 3, yPos + 6, { align: "right" });
      }
      xPos += colWidths[1];

      // Cash (right aligned)
      const cash = entry.cash > 0 ? entry.cash.toLocaleString("en-IN") : "";
      if (cash) {
        doc.text(cash, xPos + colWidths[2] - 3, yPos + 6, { align: "right" });
      }
      xPos += colWidths[2];

      // Total (right aligned with negative sign)
      let total = "";
      if (entry.total !== 0) {
        total =
          entry.total < 0
            ? `-${Math.abs(entry.total).toLocaleString("en-IN")}`
            : `${entry.total.toLocaleString("en-IN")}`;
        doc.text(total, xPos + colWidths[3] - 3, yPos + 6, { align: "right" });
      }
      xPos += colWidths[3];

      // P/L (color coded)
      const profitLoss =
        entry.profitLoss === "Profit"
          ? "Profit"
          : entry.profitLoss === "Loss"
            ? "Loss"
            : "";
      if (profitLoss) {
        if (profitLoss === "Profit") {
          doc.setTextColor(0, 128, 0); // Green
        } else {
          doc.setTextColor(255, 0, 0); // Red
        }
        doc.text(profitLoss, xPos + 2, yPos + 6);
        doc.setTextColor(0, 0, 0); // Reset to black
      }

      yPos += 8; // Increased spacing for better readability
    });

    // Add summary rows below table
    yPos += 3;

    // Total row with borders
    doc.setDrawColor(200, 200, 200);
    xPos = margin;
    headers.forEach((header, i) => {
      doc.rect(xPos, yPos, colWidths[i], 8);
      xPos += colWidths[i];
    });

    // Fill total row data
    xPos = margin;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // "Total" in date column
    doc.text("Total", xPos + 2, yPos + 6);
    xPos += colWidths[0];

    // Total Bills in bill column (right aligned)
    doc.text(
      summary.totalBills.toLocaleString("en-IN"),
      xPos + colWidths[1] - 3,
      yPos + 6,
      { align: "right" },
    );
    xPos += colWidths[1];

    // Total Cash in cash column (right aligned)
    doc.text(
      summary.totalCash.toLocaleString("en-IN"),
      xPos + colWidths[2] - 3,
      yPos + 6,
      { align: "right" },
    );
    xPos += colWidths[2];

    // Current month total in total column (right aligned)
    const currentTotal = summary.currentMonthTotal || summary.netProfitLoss;
    const currentTotalText =
      currentTotal < 0 ? `-${Math.abs(currentTotal)}` : currentTotal.toString();
    doc.text(currentTotalText, xPos + colWidths[3] - 3, yPos + 6, {
      align: "right",
    });

    yPos += 8;

    // Previous Total row (if available)
    if (summary.isMonthlyView && summary.previousTotal !== undefined) {
      // Draw borders for previous total row
      xPos = margin;
      headers.forEach((header, i) => {
        doc.rect(xPos, yPos, colWidths[i], 8);
        xPos += colWidths[i];
      });

      xPos = margin + colWidths[0] + colWidths[1]; // Start at cash column

      // "Previous Total" in cash column
      doc.text("Previous Total", xPos + 2, yPos + 6);
      xPos += colWidths[2];

      // Previous total value in total column (right aligned)
      const prevText =
        summary.previousTotal < 0
          ? `-${Math.abs(summary.previousTotal)}`
          : summary.previousTotal.toString();
      doc.text(prevText, xPos + colWidths[3] - 3, yPos + 6, { align: "right" });

      yPos += 8;
    }

    // Cumulative Total row (if available)
    if (summary.isMonthlyView && summary.cumulativeTotal !== undefined) {
      // Draw borders for cumulative total row
      xPos = margin;
      headers.forEach((header, i) => {
        doc.rect(xPos, yPos, colWidths[i], 8);
        xPos += colWidths[i];
      });

      xPos = margin;

      // "bakyya" in date column
      doc.text("bakyya", xPos + 2, yPos + 6);
      xPos += colWidths[0] + colWidths[1]; // Skip to cash column

      // "Cumulative Total" in cash column
      doc.text("Cumulative Total", xPos + 2, yPos + 6);
      xPos += colWidths[2];

      // Cumulative total value in total column (right aligned)
      const cumulativeText =
        summary.cumulativeTotal < 0
          ? `-Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`
          : `Rs.${Math.abs(summary.cumulativeTotal).toLocaleString("en-IN")}.00`;
      doc.text(cumulativeText, xPos + colWidths[3] - 3, yPos + 6, {
        align: "right",
      });
    }

    // Save
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    console.log("PDF Export - About to save PDF");
    doc.save(`ledger-report-${format.toUpperCase()}-${today}.pdf`);
    console.log("PDF Export - Successfully saved PDF");
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Error generating PDF: " + error.message);
  }
};

// Print preview function with clean styling
export const openPrintPreview = (
  entries: LedgerEntry[],
  summary: LedgerSummary,
  filterInfo: string,
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to open print preview");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ledger Report - Print Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 15px;
          font-size: 12px;
        }
        .header { text-align: center; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 18px; color: #333; }
        .header p { margin: 5px 0; color: #666; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th {
          background: linear-gradient(to bottom, #6495ED, #4682B4);
          color: white;
          font-weight: bold;
          padding: 8px 6px;
          border: 1px solid #4682B4;
          text-align: center;
          font-size: 11px;
        }

        td {
          padding: 6px;
          border: 1px solid #ddd;
          font-size: 11px;
        }

        tr:nth-child(even) { background-color: #f8f8f8; }
        tr:nth-child(odd) { background-color: white; }

        .date-col { text-align: center; width: 12%; }
        .amount-col { text-align: right; width: 18%; font-weight: 500; }
        .pl-col { text-align: center; width: 15%; font-weight: bold; }
        .notes-col { text-align: left; width: 20%; font-size: 10px; }

        .profit-cell {
          background-color: #c8e6c9 !important;
          color: #2e7d32;
        }
        .loss-cell {
          background-color: #ffcdd2 !important;
          color: #c62828;
        }
        .goods-cell {
          background-color: #e3f2fd !important;
          color: #1565c0;
        }

        .total-amount-profit { color: #2e7d32; font-weight: bold; }
        .total-amount-loss { color: #c62828; font-weight: bold; }

        @media print {
          body { margin: 10px; }
          .no-print { display: none; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ledger Report</h1>
        <p>${filterInfo}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th class="date-col">Date</th>
            <th class="amount-col">Bill</th>
            <th class="amount-col">Cash</th>
            <th class="amount-col">Total</th>
            <th class="pl-col">P/L</th>
            <th class="notes-col">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map((entry) => {
              const cleanNotes = (entry.notes || "")
                .replace(/Imported from Excel on \d{2}\/\d{2}\/\d{4}/, "")
                .trim();
              let plClass = "";
              if (entry.profitLoss === "Profit") plClass = "profit-cell";
              else if (entry.profitLoss === "Loss") plClass = "loss-cell";
              else if (entry.profitLoss === "गाड़ी में सामान")
                plClass = "goods-cell";

              const totalClass =
                entry.total < 0
                  ? "total-amount-profit"
                  : entry.total > 0
                    ? "total-amount-loss"
                    : "";

              return `
            <tr>
              <td class="date-col">${formatDate(entry.date)}</td>
              <td class="amount-col">${entry.bill > 0 ? formatCurrency(entry.bill) : "-"}</td>
              <td class="amount-col">${entry.cash > 0 ? formatCurrency(entry.cash) : "-"}</td>
              <td class="amount-col ${totalClass}">${formatCurrency(Math.abs(entry.total))}</td>
              <td class="pl-col ${plClass}">${entry.profitLoss || "-"}</td>
              <td class="notes-col">${cleanNotes || "-"}</td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 8px 16px; font-size: 14px; background: #4682B4; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        <button onclick="window.close()" style="padding: 8px 16px; font-size: 14px; background: #666; color: white; border: none; border-radius: 4px; margin-left: 10px; cursor: pointer;">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
