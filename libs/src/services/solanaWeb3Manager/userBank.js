const {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} = require('@solana/web3.js')
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

const getBankAccountAddress = async (
  ethAddress,
  generatedProgramPDA,
  tokenProgramKey
) => {
  const strippedEthAddress = ethAddress.replace('0x', '')

  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  // We b58 encode our eth address to use as seed later on
  const b58EthAddress = bs58.encode(ethAddressArr)

  const accountToGenerate = await PublicKey.createWithSeed(
    /* from pubkey / base */ generatedProgramPDA,
    /* seed */ b58EthAddress,
    /* programId / owner */ tokenProgramKey
  )
  return accountToGenerate
}

// createUserBank deterministically creates a Solana wAudio token account
// from an ethAddress (without the '0x' prefix)
async function createUserBankFrom (
  ethAddress,
  generatedProgramPDA,
  feePayerKey,
  mintKey,
  tokenProgramKey,
  audiusProgramKey,
  solanaClusterEndpoint,
  identityService
) {
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
    generatedProgramPDA,
    tokenProgramKey
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
      pubkey: generatedProgramPDA,
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
      pubkey: tokenProgramKey,
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

  const connection = new Connection(solanaClusterEndpoint)
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
      programId: audiusProgramKey.toString(),
      data: Buffer.from(serializedInstructionEnum)
    }
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}

module.exports = {
  getBankAccountAddress,
  createUserBankFrom
}
