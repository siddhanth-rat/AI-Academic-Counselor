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
