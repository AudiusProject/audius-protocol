const {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair
} = require('@solana/web3.js')
const {
  Token
} = require('@solana/spl-token')
const BN = require('bn.js')
const borsh = require('borsh')
const bs58 = require('bs58')

class CreateTokenAccountInstructionData {
  constructor ({
    ethAddress
  }) {
    this.hashed_eth_pk = ethAddress
  }
}

const createTokenAccountInstructionSchema = new Map([
  [
    CreateTokenAccountInstructionData,
    {
      kind: 'struct',
      fields: [
        ['hashed_eth_pk', [20]]
      ]
    }
  ]
])

/**
 * Gets the back account address for a user given their ethAddress
 * @param {string} ethAddress
 * @param {string} claimableTokenPDA
 * @param {PublicKey} solanaTokenProgramKey
 * @returns
 */
const getBankAccountAddress = async (
  ethAddress,
  claimableTokenPDA,
  solanaTokenProgramKey
) => {
  const strippedEthAddress = ethAddress.replace('0x', '')

  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  // We b58 encode our eth address to use as seed later on
  const b58EthAddress = bs58.encode(ethAddressArr)

  const accountToGenerate = await PublicKey.createWithSeed(
    /* from pubkey / base */ claimableTokenPDA,
    /* seed */ b58EthAddress,
    /* programId / owner */ solanaTokenProgramKey
  )
  return accountToGenerate
}

/**
 * Gets user bank account information
 * @param {string} bankAccountAddress
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @param {Connection} connection
 * @returns
 */
const getBankAccountInfo = async (
  bankAccountAddress,
  mintKey,
  solanaTokenProgramKey,
  connection
) => {
  const token = new Token(
    connection,
    mintKey,
    solanaTokenProgramKey,
    Keypair.generate()
  )
  const info = await token.getAccountInfo(bankAccountAddress)
  return info
}

/**
 * createUserBank deterministically creates a Solana wAudio token account
 * from a provided ethAddress
 * @param {string} ethAddress
 * @param {PublicKey} claimableTokenPDAKey
 * @param {PublicKey} feePayerKey
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @param {PublicKey} claimableTokenProgramKey
 * @param {Connection} connection
 * @param {IdentityService} identityService
 * @returns
 */
const createUserBankFrom = async (
  ethAddress,
  claimableTokenPDAKey,
  feePayerKey,
  mintKey,
  solanaTokenProgramKey,
  claimableTokenProgramKey,
  connection,
  identityService
) => {
  // Create instruction data
  const strippedEthAddress = ethAddress.replace('0x', '')

  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  const instructionData = new CreateTokenAccountInstructionData({
    ethAddress: ethAddressArr
  })
  const serializedInstructionData = borsh.serialize(
    createTokenAccountInstructionSchema,
    instructionData
  )

  // 0th index in the Rust instruction enum
  const serializedInstructionEnum = Uint8Array.of(
    0,
    ...serializedInstructionData
  )

  // Create the account we aim to generate
  const accountToGenerate = await getBankAccountAddress(
    ethAddress,
    claimableTokenPDAKey,
    solanaTokenProgramKey
  )

  const accounts = [
    // 0. `[sw]` Account to pay for creating token acc
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: true
    },
    // 1. `[r]` Mint account
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // 2. `[r]` Base acc used in PDA token acc (need because of create_with_seed instruction)
    {
      pubkey: claimableTokenPDAKey,
      isSigner: false,
      isWritable: false
    },
    // 3. `[w]` PDA token account to create
    {
      pubkey: accountToGenerate,
      isSigner: false,
      isWritable: true
    },
    // `[r]` Rent id
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` SPL token account id
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` System program id
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }
  ]

  const { blockhash } = await connection.getRecentBlockhash()

  const transactionData = {
    recentBlockhash: blockhash,
    instruction: {
      keys: accounts.map(account => {
        return {
          pubkey: account.pubkey.toString(),
          isSigner: account.isSigner,
          isWritable: account.isWritable
        }
      }),
      programId: claimableTokenProgramKey.toString(),
      data: Buffer.from(serializedInstructionEnum)
    }
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}

module.exports = {
  getBankAccountAddress,
  getBankAccountInfo,
  createUserBankFrom
}
