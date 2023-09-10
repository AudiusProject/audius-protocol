const {
  TransactionMessage,
  AddressLookupTableProgram,
  VersionedTransaction,
  Connection
} = require('@solana/web3.js')
const config = require('../config')

const MAX_RETRIES = 5

const sendV0Transaction = async (
  connection,
  instructions,
  feePayerAccount,
  lookupTableAccount = undefined
) => {
  const recentBlockhash = await connection.getLatestBlockhash('finalized')
  const message = new TransactionMessage({
    payerKey: feePayerAccount.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions
  }).compileToV0Message([lookupTableAccount])
  const tx = new VersionedTransaction(message)
  tx.sign([feePayerAccount])
  const serialized = tx.serialize()
  const txId = await connection.sendRawTransaction(serialized, {
    max_retries: MAX_RETRIES
  })
  console.log('REED tx sent:', txId)
  return txId
}

const createLookupTable = async (connection, instructions, feePayerAccount) => {
  const slot = (await connection.getSlot()) - 200
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: feePayerAccount.publicKey,
      payer: feePayerAccount.publicKey,
      recentSlot: slot
    })
  console.log('REED lookup table address:', lookupTableAddress.toBase58())

  const set = new Set()
  const addresses = []
  instructions.forEach((i) =>
    i.keys.map((k) => {
      if (!set.has(k.pubkey.toString())) addresses.push(k.pubkey)
      set.add(k.pubkey.toString())
    })
  )
  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: feePayerAccount.publicKey,
    authority: feePayerAccount.publicKey,
    lookupTable: lookupTableAddress,
    addresses: addresses
  })
  const tableTxId = await sendV0Transaction(
    connection,
    [lookupTableInst, extendInstruction],
    feePayerAccount
  )
  console.log('REED successfully sent table transaction', tableTxId)
  return lookupTableAddress
}

const sendTransactionWithLookupTable = async (
  instructions,
  feePayerAccount
) => {
  const SOLANA_RPC_ENDPOINT = config.get('solanaEndpoint')
  const connection = new Connection(SOLANA_RPC_ENDPOINT)

  const lookupTableAddress = await createLookupTable(
    connection,
    instructions,
    feePayerAccount
  )

  sleep(1)
  const lookupTableAccount = await connection
    .getAddressLookupTable(lookupTableAddress)
    .then((res) => res.value)
  console.log('REED num addresses:', lookupTableAccount.state.addresses.length)
  for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
    const address = lookupTableAccount.state.addresses[i]
    console.log('REED addresses in account:', i, address.toBase58())
  }

  const txId = await sendV0Transaction(
    connection,
    instructions,
    feePayerAccount,
    lookupTableAccount
  )
  console.log(
    `REED successfully sent swap transaction: https://explorer.solana.com/tx/${txid}`
  )

  // const recentBlockhashV0 = (await connection.getLatestBlockhash('finalized'))
  //   .blockhash
  // const messageV0 = new TransactionMessage({
  //   payerKey: feePayerAccount.publicKey,
  //   recentBlockhash: recentBlockhashV0,
  //   instructions // note this is an array of instructions
  // }).compileToV0Message([lookupTableAccount])

  // // create a v0 transaction from the v0 message
  // const transactionV0 = new VersionedTransaction(messageV0)

  // // sign the v0 transaction using the file system wallet we created named `payer`
  // transactionV0.sign([feePayerAccount])
  // transactionV0.serialize()

  // // send and confirm the transaction
  // // (NOTE: There is NOT an array of Signers here; see the note below...)
  // const txid = await connection.sendRawTransaction(transactionV0)
}

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

module.exports = {
  sendTransactionWithLookupTable
}
