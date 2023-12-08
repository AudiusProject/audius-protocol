import { BN, Program } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { PAYMENT_ROUTER_PROGRAM_ID } from './constants'
import { IDL } from './paymentRouter'

export const route = async (
  sender: PublicKey,
  senderOwner: PublicKey,
  paymentRouterPdaBump: number,
  recipients: PublicKey[],
  amounts: bigint[],
  totalAmount: bigint,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
  programId: PublicKey = PAYMENT_ROUTER_PROGRAM_ID
) => {
  const program = new Program(IDL, programId)
  return await program.methods
    .route(
      paymentRouterPdaBump,
      amounts.map((b) => new BN(b.toString())),
      new BN(totalAmount.toString())
    )
    .accounts({
      sender,
      senderOwner,
      splToken: tokenProgramId
    })
    .remainingAccounts(
      recipients.map((recipient) => ({
        pubkey: recipient,
        isSigner: false,
        isWritable: true
      }))
    )
    .instruction()
}
