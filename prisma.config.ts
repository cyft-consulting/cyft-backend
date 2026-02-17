import { PrismaConfig } from "@prisma/client";

export const prismaConfig: PrismaConfig = {
  adapter: {
    provider: "sqlite",
    url: "file:./prisma/dev.db", // path to your SQLite file
  },
};