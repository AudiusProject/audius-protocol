import {
  AccountMeta,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js'
import bs58 from 'bs58'
import BN from 'bn.js'

const getBankAccountAddress = async (
  ethAddress,
  generatedProgramPDA,
  tokenProgramKey
) => {
  const baseAccount = generatedProgramPDA

  // Solana client likes eth addresses as an array of uints
  const rawEthAddress = new BN(ethAddress, 'hex')

  // We b58 encode our eth address to use as seed later on
  const b58EthAddress = bs58.encode(rawEthAddress.toArrayLike(Buffer))

  const accountToGenerate = await PublicKey.createWithSeed(
    /* from pubkey / base */ baseAccount,
    /* seed */ b58EthAddress,
    /* programId / owner */ tokenProgramKey
  )
  return accountToGenerate
}

// createUserBank deterministically creates a Solana wAudio token account
// from an ethAddress (without the '0x' prefix)
async function createUserBankFrom(
  ethAddress,
  generatedProgramPDA,
  feePayerAddress,
  mintKey,
  tokenProgramKey,
  solanaClusterEndpoint,
  identityService
) {
  // Solana client likes eth addresses as an array of uints
  const rawEthAddress = new BN(ethAddress, 'hex')

  // We need to prepend a zero hero so rust knows which enum case we're dealing with
  // https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction/
  const ethAddressInstruction = Buffer.from(
    Uint8Array.of(0, ...rawEthAddress.toArray('be'))
  )

  // Assign the base account - this is the account that will
  // eventually own the created account, and is the program derived address
  // of our bank program
  //
  // we had to generate this once, and now it's hardcoded in env
  const baseAccount = generatedProgramPDA
  // const baseAccount = yield PublicKey.findProgramAddress(
  //   [mintKey.toBytes().slice(0, 32)],
  //   programPubkey
  // )[0] as PublicKey

  const accountToGenerate = await getBankAccountAddress(
    ethAddress,
    generatedProgramPDA,
    tokenProgramKey
  )

  // Keys, in order:
  // - funder (true)
  // - mint
  // - base acc
  // - acc_to_create
  // - spl_token_id
  // - rent:id()
  // - system_program:id()
  const accounts = [
    // Funder
    {
      pubkey: new PublicKey(feePayerAddress),
      isWritable: true,
      isSigner: true
    },
    // Mint
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // Base acct
    {
      pubkey: baseAccount,
      isSigner: false,
      isWritable: false
    },
    // Account to create
    {
      pubkey: accountToGenerate,
      isSigner: false,
      isWritable: true
    },
    // token program
    {
      pubkey: tokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // Rent program
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // system program
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
      programId: audiusProgramPubkey.toString(),
      data: ethAddressInstruction
    }
  }

  const response = await this.identityService.relay(transactionData)
  return response
}

module.exports = {
  getBankAccountAddress,
  createUserBankFrom
}
