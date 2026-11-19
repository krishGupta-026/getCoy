import { describe, expect, it } from "vitest";
import "server-only";

describe("test setup", () => {
  it("can import server-only modules under vitest", () => {
    expect(true).toBe(true);
  });
});
