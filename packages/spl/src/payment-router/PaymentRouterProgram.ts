import { BN, Program, Provider } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey, SystemProgram } from '@solana/web3.js'

import { IDL } from './paymentRouter'
import { CreateRouteInstructionParams } from './types'

export class PaymentRouterProgram {
  public static readonly programId = new PublicKey(
    'paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa'
  )

  public static async createPaymentRouterBalancePdaInstruction(
    paymentRouterPda: PublicKey,
    payer: PublicKey,
    programId: PublicKey = PaymentRouterProgram.programId
  ) {
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

  public static async createRouteInstruction({
    sender,
    senderOwner,
    paymentRouterPdaBump,
    recipients,
    amounts,
    totalAmount,
    tokenProgramId = TOKEN_PROGRAM_ID,
    programId = PaymentRouterProgram.programId
  }: CreateRouteInstructionParams) {
    const program = new Program(IDL, programId, {} as Provider)
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
}
