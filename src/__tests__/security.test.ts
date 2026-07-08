import { describe, it, expect, vi } from "vitest";
import { verifyCsrf } from "../lib/csrf";
import { sanitizeInput } from "../lib/sanitize";
import { NextRequest } from "next/server";

describe("CSRF Protection", () => {
  it("should allow request with no origin header", () => {
    const req = new NextRequest("http://localhost/api/v1/chats", {
      method: "POST",
      headers: {
        host: "localhost:3000"
      }
    });

    const isAllowed = verifyCsrf(req);
    expect(isAllowed).toBe(true);
  });

  it("should allow request when origin hostname matches host", () => {
    const req = new NextRequest("http://localhost/api/v1/chats", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000"
      }
    });

    const isAllowed = verifyCsrf(req);
    expect(isAllowed).toBe(true);
  });

  it("should block request when origin hostname does not match host", () => {
    const req = new NextRequest("http://localhost/api/v1/chats", {
      method: "POST",
      headers: {
        origin: "http://malicious-website.com",
        host: "localhost:3000"
      }
    });

    const isAllowed = verifyCsrf(req);
    expect(isAllowed).toBe(false);
  });

  it("should allow request matching NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://counselor.my-app.com");
    
    const req = new NextRequest("http://localhost/api/v1/chats", {
      method: "POST",
      headers: {
        origin: "https://counselor.my-app.com",
        host: "localhost:3000"
      }
    });

    const isAllowed = verifyCsrf(req);
    expect(isAllowed).toBe(true);

    vi.unstubAllEnvs();
  });
});

describe("Input Sanitizer", () => {
  it("should trim surrounding whitespace", () => {
    const input = "   Hello, world!   ";
    const result = sanitizeInput(input);
    expect(result).toBe("Hello, world!");
  });

  it("should strip HTML and script tags", () => {
    const input = "<script>alert(1)</script>I am trying to <iframe src='foo'></iframe>apply to university.";
    const result = sanitizeInput(input);
    expect(result).toBe("alert(1)I am trying to apply to university.");
  });

  it("should truncate inputs exceeding 4000 characters", () => {
    const base = "A";
    const longInput = base.repeat(5000);
    const result = sanitizeInput(longInput);
    
    expect(result).toHaveLength(4003); // 4000 chars + "..."
    expect(result.endsWith("...")).toBe(true);
  });
});
