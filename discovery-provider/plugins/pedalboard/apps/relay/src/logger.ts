import pino, { stdTimeFunctions } from "pino";

// set config for logger here
export const logger = pino({
  name: `relay`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
});

export const logRequest = () => {
  logger.info(
    {
      req: {},
    },
    "incoming request"
  );
};

export const logResponse = () => {
  logger.info(
    {
      res: {},
      req: {},
      responseTime: "",
    },
    "request completed"
  );
};
