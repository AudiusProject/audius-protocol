import { healthCheck } from "./routes/health";
import express from "express";
import { relayTransaction } from "./txRelay";
import { errorHandler } from "./middleware/errorHandler";
import {
  incomingRequestLogger,
  outgoingRequestLogger,
} from "./middleware/logging";
import { validator } from "./middleware/validator";

export const app = express();

app.use(express.json());

/** Reads */
app.get(
  "/relay/health",
  incomingRequestLogger,
  healthCheck,
  outgoingRequestLogger
);

/** Writes */
app.post(
  "/relay",
  incomingRequestLogger,
  validator,
  relayTransaction,
  outgoingRequestLogger
);

/** Register top level middlewares */
app.use(errorHandler);
