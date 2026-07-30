const { generateOtp } = require("../utils/otp.utils");

describe("generateOtp", () => {
  test("returns a string", () => {
    expect(typeof generateOtp()).toBe("string");
  });

  test("returns exactly 6 digits", () => {
    expect(generateOtp()).toHaveLength(6);
  });

  test("contains only digits", () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  test("stays in the 100000–999999 range", () => {
    const n = Number(generateOtp());
    expect(n).toBeGreaterThanOrEqual(100000);
    expect(n).toBeLessThanOrEqual(999999);
  });

  test("is different across many calls (not a constant)", () => {
    const seen = new Set();
    for (let i = 0; i < 100; i++) seen.add(generateOtp());
    // 100 random 6-digit numbers should almost never collide down to one value
    expect(seen.size).toBeGreaterThan(90);
  });
});
