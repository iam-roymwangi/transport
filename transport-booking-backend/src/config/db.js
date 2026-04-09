const { PrismaClient } = require("@prisma/client");

// Single Prisma instance (connection pooling handled by Neon)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

module.exports = prisma;
