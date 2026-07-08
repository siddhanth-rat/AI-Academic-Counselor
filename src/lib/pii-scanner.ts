/**
 * pii-scanner.ts
 * 
 * Scans extracted document text for Personally Identifiable Information (PII).
 * Returns a result indicating whether the text is clean and, if not, which
 * categories of PII were detected.
 * 
 * PRIVACY: This module never logs, stores, or transmits any PII. It only
 * returns a boolean result and category labels. All scanning is done in memory.
 */

export interface PiiScanResult {
  clean: boolean;
  detectedTypes: string[];
}

const PII_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  // === National ID / Passport ===
  {
    label: "Passport number",
    // Generic: 1-2 uppercase letters followed by 6-9 digits (covers most nations)
    pattern: /\b[A-Z]{1,2}[0-9]{6,9}\b/,
  },
  {
    label: "India Aadhaar number",
    // 12-digit number, optionally space-separated in groups of 4
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/,
  },
  {
    label: "US Social Security Number",
    // NNN-NN-NNNN format
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
  },
  {
    label: "India PAN card",
    // AAAAA9999A format
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/,
  },
  {
    label: "National ID number",
    // Generic "ID:" or "ID No" followed by digits
    pattern: /\b(id\s?(no|number|#|:))\s?[\d\-]{6,15}/i,
  },

  // === Financial ===
  {
    label: "Credit or debit card number",
    // 16-digit card in groups of 4
    pattern: /\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/,
  },
  {
    label: "Bank account number",
    // "Account" or "Acc No" followed by 9-18 digits
    pattern: /\b(account\s?(no|number|#|:))\s?[\d\-]{9,18}/i,
  },

  // === Contact ===
  {
    label: "Phone number",
    // International format +XX or local 10-digit, with optional separators
    pattern: /(\+?[\d][\d\s\-\(\)]{8,14}\d)/,
  },
  {
    label: "Email address",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  },

  // === Personal Biographic ===
  {
    label: "Date of birth",
    // Explicit "DOB", "Born on", "Date of Birth" followed by a date
    pattern: /\b(dob|born\s?on|date\s?of\s?birth)\s*[:\-]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/i,
  },
  {
    label: "Home address",
    // Street address patterns like "123 Main Street", "Flat 4B"
    pattern: /\b\d{1,5}\s+[a-z]+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|flat|apartment|apt)\b/i,
  },
];

/**
 * Scans the provided text for PII patterns.
 * @param text - The raw extracted text from a document.
 * @returns PiiScanResult with `clean: true` if no PII is found.
 */
export function scanForPii(text: string): PiiScanResult {
  const detectedTypes: string[] = [];

  for (const { label, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      detectedTypes.push(label);
    }
  }

  return {
    clean: detectedTypes.length === 0,
    detectedTypes,
  };
}

/**
 * Replaces any detected PII patterns in the text with a safe redacted placeholder.
 * @param text - The raw user input.
 * @returns The redacted text.
 */
export function redactPii(text: string): string {
  let redactedText = text;
  for (const { label, pattern } of PII_PATTERNS) {
    const globalPattern = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"
    );
    redactedText = redactedText.replace(
      globalPattern,
      `[${label.toUpperCase().replace(/\s+/g, "_")}_REDACTED]`
    );
  }
  return redactedText;
}

