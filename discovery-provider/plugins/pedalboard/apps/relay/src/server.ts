import { healthCheck } from "./routes/health";
import express from "express";
import { relayTransaction } from "./txRelay";
import { errorHandler } from "./middleware/errorHandler";
import { validationError } from "./error";

export const app = express();

/** Reads */
app.get("/relay/health", healthCheck);

/** Writes */
app.post("/relay", relayTransaction);

/** Error Tests */
app.get("/errorapp", async (req, res, next) => {
  validationError(next, "validation from apperror");
});

app.get("/errorthrown", async (req, res, next) => {
  throw new Error("KABLAM!");
});

/** Register top level middlewares */
app.use(errorHandler);
