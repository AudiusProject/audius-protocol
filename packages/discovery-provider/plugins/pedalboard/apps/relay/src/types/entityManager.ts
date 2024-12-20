import { BigNumber, Bytes } from 'ethers'

/**
 * Type that represents the arguments sent directly to a manageEntity contract call
 */
export type ManageEntityParameters = {
  userId: BigNumber
  entityType: string
  entityId: BigNumber
  action: string
  // TODO: use conditional typing based on action here
  metadata: any
  nonce: Bytes
  subjectSig: Bytes
}
