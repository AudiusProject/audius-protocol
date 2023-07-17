import App from "basekit/src/app";
import { RelayRequestType, RelayResponseType } from "../types/relay";
import { SharedData } from "..";
import { relayTransaction } from "../txRelay";

export const relayHandler = async (
  app: App<SharedData>,
  req: RelayRequestType
): Promise<RelayResponseType> => {
  try {
    const { receipt } = await relayTransaction(app, req);
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
