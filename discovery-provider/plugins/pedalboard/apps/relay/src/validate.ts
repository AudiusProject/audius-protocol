import { decodeAbi } from "./abi"
import { ManageEntityParameters } from "./types/entityManager"

/// async in case we need to make a db call
export const validateTransactionData = async (encodedABI: string): Promise<ManageEntityParameters> => {
    const decoded = decodeAbi(encodedABI)
    // TODO: validate decoded tx with zod
    // TODO: maybe check transactions table? this is no longer possible with the way identity works
    // TODO: filter replica set updates
    // if (failed) throw new Error("validation failed")
    return decoded
}

export const validateSupportedContract = (supportedContracts: string[], requestedContract: string): boolean => {
    return supportedContracts.includes(requestedContract)
}
