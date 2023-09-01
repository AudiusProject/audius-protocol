import {
  TransactionReceipt,
} from "@ethersproject/abstract-provider";

 export type RelayRequest = {
  contractRegistryKey?: string | null;
  contractAddress?: string | null;
  senderAddress?: string | null;
  encodedABI?: string | null;
  gasLimit?: number | null;
  handle?: string | null;
  nethermindContractAddress?: string | null;
  nethermindEncodedAbi?: string | null;
}

export type RelayResponse = {
  receipt: TransactionReceipt
}

export type RelayRequestHeaders = {
  encodedDataMessage?: string | string[];
  signature?: string | string[];
  reqIp: string;
};
