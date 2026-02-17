// prisma/prisma.config.js
import { PrismaClient } from "@prisma/client";

export const prisma = PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db", // path to your SQLite file
    },
  },
});