import { createJupiterApiClient, Instruction } from '@jup-ag/api'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

export const parseJupiterInstruction = (instruction: Instruction) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable
    })),
    data: Buffer.from(instruction.data, 'base64')
  })
}

export const jupiterInstance = createJupiterApiClient()
