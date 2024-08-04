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

  /**
   * @throws if the error message isn't a custom error
   */
  public static parseSendTransactionError(error: SendTransactionError) {
    try {
      const parsed = JSON.parse(
        error.transactionError.message
      ) as CustomInstructionErrorMessage
      if (typeof parsed?.InstructionError?.[1]?.Custom === 'number') {
        return new CustomInstructionError(
          parsed.InstructionError[0],
          parsed.InstructionError[1].Custom
        )
      }
      return null
    } catch (e) {
      return null
    }
  }
}
