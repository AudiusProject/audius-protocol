/**
 * Puts an instruction in a serializable form that our relay can understand.
 *
 * @param {TransactionInstruction} instruction
 */
const prepareInstructionForRelay = (instruction) => ({
  programId: instruction.programId.toString(),
  data: instruction.data,
  keys: instruction.keys.map(({ isSigner, pubkey, isWritable }) => ({
    pubkey: pubkey.toString(),
    isSigner,
    isWritable
  }))
})

module.exports = {
  prepareInstructionForRelay
}
