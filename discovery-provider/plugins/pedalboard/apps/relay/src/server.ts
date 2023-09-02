import { healthCheck } from "./routes/health";
import express from "express"
import { relayTransaction } from "./txRelay";

export const app = express()

/** Reads */
app.get("/relay/health", healthCheck)

/** Writes */
app.post("/relay", relayTransaction)
