import { describe, it, expect } from "vitest";
import { scanForPii } from "../lib/pii-scanner";

describe("scanForPii", () => {
  it("should return clean: true for text containing no PII", () => {
    const text = "This is a statement of purpose for university admissions. I am interested in computer science.";
    const result = scanForPii(text);
    expect(result.clean).toBe(true);
    expect(result.detectedTypes).toHaveLength(0);
  });

  it("should detect passport numbers", () => {
    const text = "My passport number is Z1234567. Please find it attached.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Passport number");
  });

  it("should detect India Aadhaar numbers", () => {
    const textWithSpaces = "My Aadhaar is 1234 5678 9012.";
    const result1 = scanForPii(textWithSpaces);
    expect(result1.clean).toBe(false);
    expect(result1.detectedTypes).toContain("India Aadhaar number");

    const textWithoutSpaces = "My Aadhaar is 123456789012.";
    const result2 = scanForPii(textWithoutSpaces);
    expect(result2.clean).toBe(false);
    expect(result2.detectedTypes).toContain("India Aadhaar number");
  });

  it("should detect US Social Security Numbers", () => {
    const text = "My SSN is 123-45-6789.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("US Social Security Number");
  });

  it("should detect India PAN card numbers", () => {
    const text = "My PAN number is ABCDE1234F.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("India PAN card");
  });

  it("should detect generic National ID numbers", () => {
    const text = "National ID: 9876543210";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("National ID number");
  });

  it("should detect credit or debit card numbers", () => {
    const text = "My card number is 1234-5678-9012-3456.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Credit or debit card number");
  });

  it("should detect bank account numbers", () => {
    const text = "My account: 123456789012";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Bank account number");
  });

  it("should detect phone numbers", () => {
    const text = "Reach out to me at +91 98765 43210.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Phone number");
  });

  it("should detect dates of birth", () => {
    const text = "My date of birth: 15/08/1995.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Date of birth");
  });

  it("should detect home addresses", () => {
    const text = "Send it to 123 Baker Street.";
    const result = scanForPii(text);
    expect(result.clean).toBe(false);
    expect(result.detectedTypes).toContain("Home address");
  });
});
