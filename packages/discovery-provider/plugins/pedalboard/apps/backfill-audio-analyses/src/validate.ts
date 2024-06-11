import { decodeAbi } from "./abi";
import { logger } from "./logger";
import { ManageEntityParameters } from "./types/entityManager";

/// async in case we need to make a db call
export const validateTransactionData = async (
  encodedABI: string
): Promise<ManageEntityParameters> => {
  const decoded = decodeAbi(encodedABI);
  return decoded;
};

// throws if contract not valid
export const validateSupportedContract = (
  supportedContracts: string[],
  requestedContract: string | undefined
) => {
  // requestor did not provide a specified contract, expect EntityManager
  // if not outfitted for EM, the 'validateTransactionData' will fail to decode
  if (requestedContract === undefined) return;
  if (!supportedContracts.includes(requestedContract))
    throw new Error(
      `requested contract ${requestedContract} not supported by ${supportedContracts}`
    );
};
