function calcTotal(price, seats) {
  if (!Number.isFinite(price) || !Number.isFinite(seats)) {
    throw new Error("price and seats must be numbers");
  }
  if (price < 0 || seats < 1) {
    throw new Error("invalid price or seats");
  }
  return price * seats;
}

module.exports = { calcTotal };