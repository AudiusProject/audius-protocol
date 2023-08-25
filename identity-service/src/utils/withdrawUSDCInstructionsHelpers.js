const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token')
const { Keypair } = require('@solana/web3.js')
const config = require('../config')
const { isRelayAllowedProgram, Instruction } = require('./relayHelpers')

const checkCreateAccountInstruction = (instruction) => {
  const isCreateInstruction =
    instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toString()
  return isCreateInstruction
}

const checkCloseAccountInstruction = (instruction) => {
  const feePayerKeypairs = config.get('solanaFeePayerWallets')
  const feePayerPubkeys = feePayerKeypairs.map((wallet) =>
    Keypair.fromSecretKey(
      Uint8Array.from(wallet.privateKey)
    ).publicKey.toString()
  )
  const isCloseInstruction =
    instruction.programId === TOKEN_PROGRAM_ID.toString() &&
    instruction.data &&
    instruction.data.data &&
    instruction.data.data[0] === 9
  const isFeePayerReimbursed = feePayerPubkeys.includes(
    instruction.keys[1].pubkey
  )
  return isCloseInstruction && isFeePayerReimbursed
}

/**
 * Checks if the given instructions are a USDC withdrawal swap transaction. This is a special case
 * where a USDC associated token account is created, used for swapping USDC for SOL, and then closed.
 */
const isUSDCWithdrawalTransaction = (instructions) => {
  if (!instructions.length) return false
  const validations = []
  validations.push(checkCreateAccountInstruction(instructions[0]))
  validations.push(
    checkCloseAccountInstruction(instructions[instructions.length - 1])
  )
  validations.push(
    isRelayAllowedProgram(instructions[1]) &&
      isRelayAllowedProgram(instructions[2])
  )

  console.log(`REED validations ${validations}`)
  console.log(`REED returning ${validations.every((validation) => validation)}`)
  return validations.every((validation) => validation)
}

module.exports = {
  isUSDCWithdrawalTransaction
}
