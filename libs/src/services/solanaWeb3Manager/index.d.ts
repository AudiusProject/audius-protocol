import type { PublicKey, TransactionInstruction } from '@solana/web3.js'

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
  transactionHandler: TransactionHandler
}

export default SolanaWeb3Manager
