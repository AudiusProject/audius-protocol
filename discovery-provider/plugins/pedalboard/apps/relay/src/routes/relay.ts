import App from "basekit/src/app";
import { RelayRequestType, RelayResponseType } from "../types/relay";
import { SharedData } from "..";
import { relayTransaction } from "../txRelay";
import { IncomingHttpHeaders } from "http";

export const relayHandler = async (
  app: App<SharedData>,
  reqHeaders: IncomingHttpHeaders,
  req: RelayRequestType
): Promise<RelayResponseType> => {
  try {
    const headers = { encodedDataMessage: reqHeaders[''], signature: reqHeaders[''] }
    const { receipt } = await relayTransaction(app, headers, req);
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
