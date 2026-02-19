import "dotenv/config";
import app from "./app.js";
import { initPostgres } from "./db/initPostgres.js";

const startServer = async () => {
  try {
    if (process.env.DATABASE_URL) {
      await initPostgres();
    } else {
      console.log("ℹ️ Skipping PostgreSQL (no DATABASE_URL)");
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
