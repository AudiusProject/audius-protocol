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

// initialize connection and values
let solanaConnection = new solanaWeb3.Connection(RPC_ENDPOINT)
const FUNDER_SOL_ACCOUNT = (new solanaWeb3.Account(FUNDER_PRIVATE_KEY))
const FUNDER_PUBLIC_KEY = (new solanaWeb3.Account(FUNDER_PRIVATE_KEY)).publicKey

async function getBalance () {
  const feePayerBalance = await solanaConnection.getBalance(FEE_PAYER_PUBLIC_KEY)
  console.log(`Fee payer balance: ${feePayerBalance} at ${FEE_PAYER_PUBLIC_KEY}`)

  const funderBalance = await solanaConnection.getBalance(FUNDER_PUBLIC_KEY)
  console.log(`Funder balance: ${funderBalance} at ${FUNDER_PUBLIC_KEY}`)
}

async function transferBalance (amountToTransfer = solanaWeb3.LAMPORTS_PER_SOL) {
  var transaction = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: FUNDER_PUBLIC_KEY,
      toPubkey: FEE_PAYER_PUBLIC_KEY,
      lamports: amountToTransfer
    })
  )
  // Sign transaction, broadcast, and confirm
  var signature = await solanaWeb3.sendAndConfirmTransaction(
    solanaConnection,
    transaction,
    [FUNDER_SOL_ACCOUNT]
  )
  console.log('SIGNATURE', signature)
  console.log('SUCCESS')
}

async function run () {
  try {
    await getBalance()
    await transferBalance()
    await getBalance()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  process.exit(0)
}

run()
