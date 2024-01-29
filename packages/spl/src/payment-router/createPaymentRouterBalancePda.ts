import { Program } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'

import { PAYMENT_ROUTER_PROGRAM_ID } from './constants'
import { IDL } from './paymentRouter'

export const createPaymentRouterBalancePda = async (
  paymentRouterPda: PublicKey,
  payer: PublicKey,
  programId: PublicKey = PAYMENT_ROUTER_PROGRAM_ID
) => {
  const program = new Program(IDL, programId)
  return await program.methods
    .createPaymentRouterBalancePda()
    .accounts({
      paymentRouterPda,
      payer,
      systemProgram: SystemProgram.programId
    })
    .instruction()
}
