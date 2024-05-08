import { PublicKey } from '@solana/web3.js'

export type CreateRouteInstructionParams = {
  sender: PublicKey
  senderOwner: PublicKey
  paymentRouterPdaBump: number
  recipients: PublicKey[]
  amounts: bigint[]
  totalAmount: bigint
  tokenProgramId?: PublicKey
  programId?: PublicKey
}
