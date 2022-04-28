import type {
  Connection,
  PublicKey,
  TransactionInstruction
} from '@solana/web3.js'

type HandleTransactionParams = {
  instructions: TransactionInstruction[]
  errorMapping: Object | null
  recentBlockhash: string | null
  logger: any | null
  skipPreflight: boolean | null
  feePayerOverride: PublicKey | null
  sendBlockhash: boolean | null
  signatures: Array<{ publicKey: string; signature: Buffer }> | null
}

class TransactionHandler {
  handleTransaction(HandleTransactionParams): Promise<Any>
}

class SolanaWeb3Manager {
  init(): Promise<void>
  findProgramAddress: (programId: PublicKey, pubkey: PublicKey) => Promise<any>
  findDerivedPair: (
    programId: PublicKey,
    adminAccount: PublicKey,
    seed: Buffer | Uint8Array
  ) => Promise<{
    baseAuthorityAccount: PublicKey
    derivedAddress: PublicKey
    bumpSeed: number
  }>

  findDerivedAddress: (
    programId: PublicKey,
    adminAccount: PublicKey,
    seed: Buffer | Uint8Array
  ) => Promise<[PublicKey, number]>

  feePayerKey: PublicKey
  transactionHandler: TransactionHandler
  connection: Connection
}

export default SolanaWeb3Manager
