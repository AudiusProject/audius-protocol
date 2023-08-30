import App from "basekit/src/app";
import {
  RelayRequestHeaders,
  RelayRequestType,
  RelayResponseType,
} from "../types/relay";
import { SharedData } from "..";
import { relayTransaction } from "../txRelay";
import { FastifyReply } from "fastify";
import { errorResponseInternalServerError } from "../error";
import { logger } from "../logger";

export const relayHandler = async (
  app: App<SharedData>,
  headers: RelayRequestHeaders,
  req: RelayRequestType,
  rep: FastifyReply
): Promise<RelayResponseType | undefined> => {
  try {
    const { receipt } = await relayTransaction(app, headers, req, rep);
    return {
      receipt: {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
      },
    };
  } catch (e) {
    logger.error({ error_msg: "relay.ts | internal server error", error: e, request: req })
    errorResponseInternalServerError(rep)
  }
};
