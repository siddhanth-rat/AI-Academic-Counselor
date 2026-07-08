/**
 * Sanitizes user inputs before processing or storage.
 * - Trims whitespace.
 * - Strips HTML/script tags to prevent stored HTML/XSS injections.
 * - Enforces a length limit (max 4000 characters) to prevent prompt overflow or resource exhaustion.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  
  // 1. Trim whitespace
  let clean = text.trim();
  
  // 2. Strip HTML tags
  clean = clean.replace(/<[^>]*>/g, "");
  
  // 3. Truncate abnormally long inputs (max 4000 chars)
  if (clean.length > 4000) {
    clean = clean.slice(0, 4000) + "...";
  }
  
  return clean;
}

/**
 * Validates if the text contains common profanity or abusive language patterns.
 * @param text - The raw user input.
 * @returns True if abusive language is detected.
 */
export function containsAbusiveLanguage(text: string): boolean {
  if (!text) return false;

  const abusivePatterns = [
    /\bfuck(ing|er|ed|s)?\b/i,
    /\bshit(ty|head|s)?\b/i,
    /\basshole(s)?\b/i,
    /\bbitch(es|ing)?\b/i,
    /\bbastard(s)?\b/i,
    /\bcunt(s)?\b/i,
    /\bdick(s)?\b/i,
    /\bpussy(ies)?\b/i,
    /\bwanker(s)?\b/i,
    /\bchutiya(giri|pa)?\b/i,
    /\bgandu(s)?\b/i,
    /\bmadarchod(s)?\b/i,
    /\bbehenchod(s)?\b/i,
    /\bbhonsdi\b/i,
    /\blund\b/i,
  ];

  const lowerText = text.toLowerCase();
  return abusivePatterns.some((pattern) => pattern.test(lowerText));
}

