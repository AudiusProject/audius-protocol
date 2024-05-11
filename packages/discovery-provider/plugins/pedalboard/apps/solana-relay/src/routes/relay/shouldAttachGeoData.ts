import {
  TransactionInstruction,
} from '@solana/web3.js'
import { config } from '../../config'

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
const MEMO_V2_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
const PAYMENT_ROUTER_PROGRAM_ID = config.paymentRouterProgramId

const RECOVERY_MEMO_STRING = "Recover Withdrawal"

/**
 * Determines whether or not the provided instructions are from a payment transaction
 * @param instructions the instructions to check
 * @returns boolean
 */
const isPaymentTransaction = (
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
        console.log(instruction.data)
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
 * Determines whether or not the provided instructions call for an added geolocation memo
 * @param instructions the instructions to check
 * @returns boolean
 */
export const shouldAttachGeoData = (
  instructions: TransactionInstruction[]
) => {
  return isPaymentTransaction(instructions)
}
