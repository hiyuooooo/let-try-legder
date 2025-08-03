// PDF font configuration for Hindi support
import jsPDF from "jspdf";

// Add Hindi font support using a fallback approach
export const setupHindiFonts = (doc: jsPDF) => {
  // For Hindi text support, we'll use a Unicode-compatible approach
  // Since adding actual Devanagari fonts requires font files, we'll use transliteration

  return doc;
};

// Convert Hindi text to Roman transliteration for PDF compatibility
export const convertHindiForPDF = (text: string): string => {
  const hindiToRoman: Record<string, string> = {
    "गाड़ी में सामान": "Gaadi Mein Samaan",
    गाड़ी: "Gaadi",
    में: "Mein",
    सामान: "Samaan",
    लाभ: "Profit",
    हानि: "Loss",
    कुल: "Total",
    "तारी��": "Date",
    बिल: "Bill",
    नकद: "Cash",
    नोट्स: "Notes",
  };

  // Replace Hindi text with Roman equivalents
  let convertedText = text;
  Object.entries(hindiToRoman).forEach(([hindi, roman]) => {
    convertedText = convertedText.replace(new RegExp(hindi, "g"), roman);
  });

  return convertedText;
};

// Format text for PDF display with proper encoding
export const formatTextForPDF = (text: string): string => {
  if (!text) return "";

  // Convert Hindi to Roman script
  let formattedText = convertHindiForPDF(text);

  // Clean up any remaining special characters
  formattedText = formattedText.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters

  return formattedText || text; // Fallback to original if empty
};
