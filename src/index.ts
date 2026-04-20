import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taxesRoutes from "./routes/taxes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/taxes", taxesRoutes);

app.listen(3001, () => {
  console.log("✅ Backend Express + MariaDB en puerto 3001");
});
``
