const { ASSOCIATED_TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair
} = require('@solana/web3.js')

/**
 * Finds the associated token address given a solana wallet public key
 * @param {PublicKey} solanaWalletKey Public Key for a given solana account (a wallet)
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @returns {PublicKey} token account public key
 */
async function findAssociatedTokenAddress ({
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey
}) {
  const addresses = await PublicKey.findProgramAddress(
    [
      solanaWalletKey.toBuffer(),
      solanaTokenProgramKey.toBuffer(),
      mintKey.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return addresses[0]
}

/**
 * Gets token account information (e.g. balance, ownership, etc.)
 * @param {PublicKey} tokenAccountAddressKey
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @param {Connection} connection
 * @returns {AccountInfo}
 */
async function getAssociatedTokenAccountInfo ({
  tokenAccountAddressKey,
  mintKey,
  solanaTokenProgramKey,
  connection
}) {
  const token = new Token(
    connection,
    mintKey,
    solanaTokenProgramKey,
    Keypair.generate()
  )
  const info = await token.getAccountInfo(tokenAccountAddressKey)
  return info
}

/**
 * Creates an associated token account for a given solana account (a wallet)
 * @param {PublicKey} feePayerKey
 * @param {PublicKey} solanaWalletKey the wallet we wish to create a token account for
 * @param {PublicKey} mintKey
 * @param {PublicKey} solanaTokenProgramKey
 * @param {Connection} connection
 * @param {IdentityService} identityService
 */
async function createAssociatedTokenAccount ({
  feePayerKey,
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey,
  connection,
  identityService
}) {
  const associatedTokenAddress = await findAssociatedTokenAddress({
    solanaWalletKey,
    mintKey,
    solanaTokenProgramKey
  })

  const accounts = [
    // 0. `[sw]` Funding account (must be a system account)
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: true
    },
    // 1. `[w]` Associated token account address to be created
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true
    },
    // 2. `[r]` Wallet address for the new associated token account
    {
      pubkey: solanaWalletKey,
      isSigner: false,
      isWritable: false
    },
    // 3. `[r]` The token mint for the new associated token account
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // 4. `[r]` System program
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` SPL Token program
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` Rent sysvar
    {
      pubkey: SYSVAR_RENT_PUBKEY,
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
      programId: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
      data: Buffer.from([])
    }
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}

module.exports = {
  findAssociatedTokenAddress,
  getAssociatedTokenAccountInfo,
  createAssociatedTokenAccount
}
