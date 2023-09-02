import {
  RelayRequestHeaders,
  RelayRequestType,
  RelayResponseType,
} from "../types/relay";
import { relayTransaction } from "../txRelay";
import { FastifyReply } from "fastify";

export const relayHandler = async (
  headers: RelayRequestHeaders,
  req: RelayRequestType,
  rep: FastifyReply
): Promise<RelayResponseType> => {
  try {
    const { receipt } = await relayTransaction(headers, req, rep);
    return {
      receipt: {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
      },
    };
  } catch (e) {
    // return useful error back to caller from here
    console.error("relay error = ", e);
    throw e;
  }
};
