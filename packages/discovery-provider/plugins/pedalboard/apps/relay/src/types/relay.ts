import { TransactionReceipt } from "@ethersproject/abstract-provider";

/** Raw request type that matches what libs can possibly send. */
export type RelayRequest = {
  contractRegistryKey?: string | null;
  contractAddress?: string | null;
  senderAddress?: string | null;
  encodedABI?: string | null;
  gasLimit?: number | null;
  handle?: string | null;
};

/** Post validation type that's injected into ctx after validation middleware. */
export type ValidatedRelayRequest = {
  contractRegistryKey: string;
  contractAddress: string;
  senderAddress?: string;
  encodedABI: string;
  gasLimit: number;
  handle?: string;
};

/** Type sent back on a successful relay. */
export type RelayResponse = {
  receipt: TransactionReceipt;
};
