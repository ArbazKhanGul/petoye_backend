// Utility to parse time strings like '1d', '2h', etc. to ms
// Usage: ms('1d') => 86400000
module.exports = function ms(val) {
  if (typeof val === "number") return val;
  const match = /^([0-9]+)([smhd])$/.exec(val);
  if (!match) throw new Error("Invalid time format: " + val);
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      throw new Error("Invalid time unit: " + match[2]);
  }
};
