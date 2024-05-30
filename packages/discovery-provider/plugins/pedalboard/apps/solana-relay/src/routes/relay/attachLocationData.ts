import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage
} from '@solana/web3.js'

import { config } from '../../config'
import { LocationData } from '../../utils/ipData'

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
const MEMO_V2_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
const PAYMENT_ROUTER_PROGRAM_ID = config.paymentRouterProgramId

const RECOVERY_MEMO_STRING = 'Recover Withdrawal'
const GEO_MEMO_STRING = 'geo'

/**
 * Determines whether or not the provided instructions are from a payment transaction
 * @param instructions the instructions to check
 * @returns boolean
 */
export const isPaymentTransaction = (
  instructions: TransactionInstruction[]
) => {
  let usesPaymentRouter = false
  let isRecovery = false
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    switch (instruction.programId.toBase58()) {
      case PAYMENT_ROUTER_PROGRAM_ID:
        usesPaymentRouter = true
        break
      case MEMO_PROGRAM_ID:
      case MEMO_V2_PROGRAM_ID: {
        const memo = instruction.data.toString()
        if (memo === RECOVERY_MEMO_STRING) {
          isRecovery = true
        }
        break
      }
      default:
        break
    }
  }
  return usesPaymentRouter && !isRecovery
}

/**
 * Attaches location data to a TransactionMessage
 */
export const attachLocationData = ({
  transactionMessage,
  location
}: {
  transactionMessage: TransactionMessage
  location: LocationData
}): TransactionMessage => {
  const memoInstruction = new TransactionInstruction({
    keys: [
      { pubkey: transactionMessage.payerKey, isSigner: true, isWritable: true }
    ],
    data: Buffer.from(
      `${GEO_MEMO_STRING}:${JSON.stringify(location)}`,
      'utf-8'
    ),
    programId: new PublicKey(MEMO_V2_PROGRAM_ID)
  })
  const updatedInstructions = [
    ...transactionMessage.instructions,
    memoInstruction
  ]
  const msg = new TransactionMessage({
    payerKey: transactionMessage.payerKey,
    recentBlockhash: transactionMessage.recentBlockhash,
    instructions: updatedInstructions
  })
  return msg
}
