const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token')
const { Keypair } = require('@solana/web3.js')
const config = require('../config')

const solanaClaimableTokenProgramAddress = config.get(
  'solanaClaimableTokenProgramAddress'
)

const allowedProgramIds = [
  solanaClaimableTokenProgramAddress,
  /* secp */ 'KeccakSecp256k11111111111111111111111111111'
]

const isRelayAllowedProgram = (instructions) => {
  console.log(`REED isRelayAllowedProgram ${JSON.stringify(instructions)}`)
  for (const instruction of instructions) {
    console.log(
      `REED checking ${
        instruction.programId
      } using allowedProgramIds ${JSON.stringify(allowedProgramIds)}`
    )
    if (!allowedProgramIds.includes(instruction.programId)) {
      return false
    }
  }
  return true
}

const checkCreateAccountInstruction = (instruction) => {
  const isCreateInstruction =
    instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toString()
  return isCreateInstruction
}

const checkCloseAccountInstruction = (instruction) => {
  console.log(
    `REED checkCloseAccountInstruction ${JSON.stringify(instruction)}`
  )
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
  console.log(`REED feePayerPubkeys ${feePayerPubkeys}`)
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
  validations.push(isRelayAllowedProgram(instructions.slice(1, 3)))
  validations.push(
    checkCloseAccountInstruction(instructions[instructions.length - 1])
  )

  console.log(`REED validations ${validations}`)
  console.log(`REED returning ${validations.every((validation) => validation)}`)
  return validations.every((validation) => validation)
}

module.exports = {
  isUSDCWithdrawalTransaction
}
