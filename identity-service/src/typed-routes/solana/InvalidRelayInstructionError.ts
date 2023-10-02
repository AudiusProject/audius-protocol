export class InvalidRelayInstructionError extends Error {
  constructor(instructionIndex: number, message: string) {
    super(`Instruction ${instructionIndex ?? '?'}: ${message}`)
    this.name = 'InvalidRelayInstructionError'
  }
}
