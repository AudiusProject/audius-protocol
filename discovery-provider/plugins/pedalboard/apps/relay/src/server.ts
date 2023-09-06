import { healthCheck } from "./routes/health";
import express from "express";
import { relayTransaction } from "./txRelay";
import { errorHandler } from "./middleware/errorHandler";
import {
  incomingRequestLogger,
  outgoingRequestLogger,
} from "./middleware/logging";
import { validator } from "./middleware/validator";
import cors from 'cors'
import bodyParser from "body-parser";

export const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.text())
app.use(cors());

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
