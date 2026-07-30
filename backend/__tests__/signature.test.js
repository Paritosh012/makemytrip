const crypto = require("crypto");

// Mirror of the check inside verifyPayment — proves you understand it
function verifySignature(orderId, paymentId, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

describe("Razorpay signature verification", () => {
  const secret = "test_secret_key";
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  // A signature Razorpay would consider valid, computed with the same secret
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  test("accepts a correctly signed payment", () => {
    expect(verifySignature(orderId, paymentId, validSignature, secret)).toBe(true);
  });

  test("rejects a tampered signature", () => {
    expect(verifySignature(orderId, paymentId, "faked_sig", secret)).toBe(false);
  });

  test("rejects when the secret is wrong (attacker doesn't know it)", () => {
    expect(verifySignature(orderId, paymentId, validSignature, "wrong_secret")).toBe(false);
  });

  test("rejects when the order id was swapped", () => {
    expect(verifySignature("order_OTHER", paymentId, validSignature, secret)).toBe(false);
  });
});