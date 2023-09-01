import { FastifyError } from "fastify";
import { decodeAbi } from "./abi";
import { logger } from "./logger";
import { ManageEntityParameters } from "./types/entityManager";
import { RelayRequest } from "./types/relay";

export type ValidatedRelayRequest = {
  encodedAbi: string;
}

export const validateRequestParams = (req: RelayRequest): ValidatedRelayRequest => {
  const { encodedABI } = req;
  if (encodedABI === null || encodedABI === undefined) throw new Error("encodedABI is required")
  return { encodedAbi: encodedABI }
}

/// async in case we need to make a db call
export const validateTransactionData = async (
  encodedABI: string
): Promise<ManageEntityParameters> => {
  const decoded = decodeAbi(encodedABI);
  // TODO: validate decoded tx with zod
  // TODO: maybe check transactions table? this is no longer possible with the way identity works
  // TODO: filter replica set updates
  // if (failed) throw new Error("validation failed")
  logger.info("transaction data validated");
  return decoded;
};
