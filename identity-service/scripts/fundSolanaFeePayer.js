const solanaWeb3 = require('@solana/web3.js')

// input validation
if (!process.env.funderPrivateKey || !process.env.feePayerAddress) {
  console.log('funderPrivateKey and feePayerAddress env vars must be set')
  console.log('Example usage: `funderPrivateKey=[...] feePayerAddress=<address> node fundSolanaFeePayer.js`')
  process.exit(1)
}
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com' // DEVNET is https://api.devnet.solana.com
// Funder - the private key wallet that will fund the fee payer
const FUNDER_PRIVATE_KEY = process.env.funderPrivateKey ? JSON.parse(process.env.funderPrivateKey) : []
// Fee payer - the address of the wallet in identity to pay for tx's
const FEE_PAYER_PUBLIC_KEY = (new solanaWeb3.PublicKey(process.env.feePayerAddress))
const MIN_BALANCE = solanaWeb3.LAMPORTS_PER_SOL

// initialize connection and values
let solanaConnection = new solanaWeb3.Connection(RPC_ENDPOINT)
const FUNDER_SOL_ACCOUNT = (new solanaWeb3.Account(FUNDER_PRIVATE_KEY))
const FUNDER_PUBLIC_KEY = (new solanaWeb3.Account(FUNDER_PRIVATE_KEY)).publicKey

async function getBalance (publicKey) {
  if (!publicKey) throw new Error('publicKey is required, no public key passed in')
  const balance = await solanaConnection.getBalance(publicKey)
  return balance
}

async function transferBalance (amountToTransfer = solanaWeb3.LAMPORTS_PER_SOL) {
  const feePayerBalance = await getBalance(FEE_PAYER_PUBLIC_KEY)

  if (feePayerBalance < MIN_BALANCE) {
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: FUNDER_PUBLIC_KEY,
        toPubkey: FEE_PAYER_PUBLIC_KEY,
        lamports: amountToTransfer
      })
    )
    // Sign transaction, broadcast, and confirm
    const signature = await solanaWeb3.sendAndConfirmTransaction(
      solanaConnection,
      transaction,
      [FUNDER_SOL_ACCOUNT]
    )
    console.log('SIGNATURE', signature)
    console.log('SUCCESS')
  } else {
    console.log('Fee payer meets min balance')
  }
}

async function run () {
  try {
    console.log(`-------- Balances before transferring --------`)
    console.log(`Fee payer balance: ${(await getBalance(FEE_PAYER_PUBLIC_KEY)) / solanaWeb3.LAMPORTS_PER_SOL}`)
    console.log(`Funder balance: ${(await getBalance(FUNDER_PUBLIC_KEY)) / solanaWeb3.LAMPORTS_PER_SOL}`)
    await transferBalance()
    console.log(`-------- Balances after transferring --------`)
    console.log(`Fee payer balance: ${(await getBalance(FEE_PAYER_PUBLIC_KEY)) / solanaWeb3.LAMPORTS_PER_SOL}`)
    console.log(`Funder balance: ${(await getBalance(FUNDER_PUBLIC_KEY)) / solanaWeb3.LAMPORTS_PER_SOL}`)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  process.exit(0)
}

run()
