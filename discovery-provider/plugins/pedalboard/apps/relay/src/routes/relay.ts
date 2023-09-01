import App from "basekit/src/app";
import {
  RelayRequest,
  RelayRequestHeaders,
  RelayResponse,
} from "../types/relay";
import { SharedData } from "..";
import { relayTransaction } from "../txRelay";
import { IncomingHttpHeaders } from "http";
import { FastifyReply } from "fastify";

export const relayHandler = async (
  app: App<SharedData>,
  headers: RelayRequestHeaders,
  req: RelayRequest,
  rep: FastifyReply
): Promise<RelayResponse> => {
  try {
    const { receipt } = await relayTransaction(app, headers, req, rep);
    return { receipt };
  } catch (e) {
    // return useful error back to caller from here
    console.error("relay error = ", e);
    throw e;
  }
};
