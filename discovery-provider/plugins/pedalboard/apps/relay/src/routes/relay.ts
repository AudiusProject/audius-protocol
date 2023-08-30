import App from "basekit/src/app";
import {
  RelayRequestHeaders,
  RelayRequestType,
  RelayResponseType,
} from "../types/relay";
import { SharedData } from "..";
import { relayTransaction } from "../txRelay";
import { FastifyReply } from "fastify";
import {
  handleError,
  isError,
} from "../error";
import { logger } from "../logger";

export const relayHandler = async (
  app: App<SharedData>,
  headers: RelayRequestHeaders,
  req: RelayRequestType,
  rep: FastifyReply
): Promise<RelayResponseType | undefined> => {
  const relay = await relayTransaction(app, headers, req, rep);
  if (!isError(relay)) {
    const { receipt } = relay;
    return {
      receipt: {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
      },
    };
  }
  handleError(relay, rep);
};
