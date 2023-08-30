import { FastifyError, FastifyErrorCodes, FastifyReply } from "fastify";
import { logger } from "./logger";

export enum CustomErrorCodes {
  UNAUTHORIZED = "UNAUTHORIZED"
}

export const createError = ({
  statusCode,
  name,
  message,
}: {
  statusCode: number;
  name: CustomErrorCodes | FastifyErrorCodes;
  message?: string;
}): FastifyError => {
  return {
    statusCode,
    name: name.toString(),
    code: name.toString(),
    message: message || "",
  };
};

export const errorResponseInternalServerError = (rep: FastifyReply) => {
  rep.code(500).send();
};

export const isError = (obj: unknown): obj is FastifyError => {
  return (obj as FastifyError).code !== undefined;
};

export const handleError = (e: FastifyError, rep: FastifyReply) => {
  if (e.statusCode && e.statusCode < 500) {
    rep.code(e.statusCode).send({
      statusCode: e.statusCode,
      error: e.name,
      message: e.message,
    });
  }
  // internal error
  logger.error({ error_msg: "relay.ts | internal server error", e });
  errorResponseInternalServerError(rep);
  return;
};
