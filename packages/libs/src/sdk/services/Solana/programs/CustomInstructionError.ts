import { SendTransactionError } from '@solana/web3.js'

type CustomInstructionErrorMessage = {
  InstructionError: [number, { Custom: number }]
}

export class CustomInstructionError extends Error {
  constructor(public instructionIndex: number, public code: number) {
    super(
      JSON.stringify({
        InstructionError: [instructionIndex, { Custom: code }]
      })
    )
  }

  public static parseSendTransactionError(error: SendTransactionError) {
    const parsed = JSON.parse(
      error.transactionError.message
    ) as CustomInstructionErrorMessage
    if (typeof parsed?.InstructionError?.[1]?.Custom === 'number') {
      return new CustomInstructionError(
        parsed.InstructionError[0],
        parsed.InstructionError[1].Custom
      )
    }
    throw new Error('Unable to parse custom transaction error')
  }
}
