import App from "basekit/src/app";
import { FastifyReply, FastifyRequest } from "fastify";
import { TransactionReceipt, Address } from "web3";
import { RelayRequestType, RelayResponseType } from "../types/relay";
import { SharedData } from "..";

export const relayHandler = async (
  app: App<SharedData>,
  req: RelayRequestType
): Promise<RelayResponseType> => {
  return {
    receipt: {
      blockHash:
        "0xa5b9d60f32436310afebcfda832817a68921beb782fabf7915cc0460b443116a",
      blockNumber: 3,
    },
  };
};
