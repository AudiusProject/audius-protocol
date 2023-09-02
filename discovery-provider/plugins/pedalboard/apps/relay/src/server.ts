import { healthCheck } from "./routes/health";
import express from "express";
import { relayTransaction } from "./txRelay";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

/** Reads */
app.get("/relay/health", healthCheck);

/** Writes */
app.post("/relay", relayTransaction);

/** Register top level middlewares */
app.use(errorHandler);
