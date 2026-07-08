import { describe, it, expect } from "vitest";
import { containsAbusiveLanguage } from "../lib/sanitize";
import { redactPii } from "../lib/pii-scanner";

describe("New Security Features", () => {
  describe("containsAbusiveLanguage (Profanity Blocker)", () => {
    it("should return false for professional/clean input", () => {
      expect(containsAbusiveLanguage("Hello, could you help me find target universities in Canada?")).toBe(false);
      expect(containsAbusiveLanguage("I need assistance planning my education loan.")).toBe(false);
    });

    it("should detect offensive English swear words", () => {
      expect(containsAbusiveLanguage("This is fucking crazy!")).toBe(true);
      expect(containsAbusiveLanguage("Don't be an asshole.")).toBe(true);
      expect(containsAbusiveLanguage("Shut up bitch.")).toBe(true);
    });

    it("should detect local Hindi/Indian slang words", () => {
      expect(containsAbusiveLanguage("Saala chutiya system h")).toBe(true);
      expect(containsAbusiveLanguage("gandu admissions criteria")).toBe(true);
      expect(containsAbusiveLanguage("tereko madarchod bolega")).toBe(true);
    });
  });

  describe("redactPii (Inline PII Redaction)", () => {
    it("should keep clean text unchanged", () => {
      const text = "Please evaluate my profile for MS in Data Science.";
      expect(redactPii(text)).toBe(text);
    });

    it("should redact phone numbers in text prompts", () => {
      const text = "Call me at +91 9876543210 or 98765-43210";
      const redacted = redactPii(text);
      expect(redacted).toContain("[PHONE_NUMBER_REDACTED]");
      expect(redacted).not.toContain("9876543210");
    });

    it("should redact emails in text prompts", () => {
      const text = "My email is student@example.com for notifications.";
      const redacted = redactPii(text);
      expect(redacted).toContain("[EMAIL_ADDRESS_REDACTED]");
      expect(redacted).not.toContain("student@example.com");
    });
  });
});
