import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import tasksRoute from "./routes/tasks.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";

const app = express();

app.use(
    cors({
      origin: ["http://localhost:5174", "https://cyftconsulting.com"],
      credentials: true, // if you need cookies/auth headers
    })
  );
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/staff", staffRoutes);
app.use("/tasks", tasksRoute);
app.use("/announcements", announcementRoutes);
app.use("/uploads", express.static("uploads"));

export default app;
