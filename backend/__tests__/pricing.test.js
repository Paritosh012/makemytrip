const { calcTotal } = require("../utils/pricing");

describe("calcTotal", () => {
  test("multiplies price by seats", () => {
    expect(calcTotal(4500, 2)).toBe(9000); // your Goa Tour case
  });

  test("handles a single seat", () => {
    expect(calcTotal(4500, 1)).toBe(4500);
  });

  test("rejects zero seats", () => {
    expect(() => calcTotal(4500, 0)).toThrow();
  });

  test("rejects a negative price", () => {
    expect(() => calcTotal(-100, 2)).toThrow();
  });

  test("rejects non-numeric input", () => {
    expect(() => calcTotal("4500", 2)).toThrow();
  });
});