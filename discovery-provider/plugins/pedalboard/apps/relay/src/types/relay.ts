import { Static, Type } from "@sinclair/typebox";

export const RelayRequest = Type.Object({
  senderAddress: Type.String(),
  encodedABI: Type.String(),
  gasLimit: Type.Optional(Type.Integer()),
  contractRegistryKey: Type.Optional(Type.String()),
});

export type RelayRequestType = Static<typeof RelayRequest>;

export const RelayReceipt = Type.Object({
  // need to find a way to enforce actual TransactionReceipt here
  blockHash: Type.String(),
  blockNumber: Type.Integer(),
});

export type RelayReceiptType = Static<typeof RelayReceipt>;

export const RelayResponse = Type.Object({
  receipt: RelayReceipt,
});

export type RelayResponseType = Static<typeof RelayResponse>;

export type RelayRequestHeaders = {
  encodedDataMessage?: string | string[];
  signature?: string | string[];
  reqIp: string;
};
