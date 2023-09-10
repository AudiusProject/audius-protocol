const {
  TransactionMessage,
  AddressLookupTableProgram,
  VersionedTransaction,
  Connection,
  PublicKey
} = require('@solana/web3.js')
const config = require('../config')

const MAX_RETRIES = 5
const SLEEP_TIME = 20

const sendV0Transaction = async (
  connection,
  instructions,
  feePayerAccount,
  lookupTableArray = undefined,
  signatures = []
) => {
  const recentBlockhash = await connection.getLatestBlockhash('finalized')
  console.log('REED recentBlockhash:', recentBlockhash)
  const message = new TransactionMessage({
    payerKey: feePayerAccount.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions
  }).compileToV0Message(lookupTableArray)
  console.log('REED message:', message)
  const tx = new VersionedTransaction(message)
  console.log('REED tx:', tx)
  tx.sign([feePayerAccount])
  if (Array.isArray(signatures)) {
    signatures.forEach(({ publicKey, signature }) => {
      tx.addSignature(new PublicKey(publicKey), signature)
    })
  }
  console.log('REED signed tx:', tx)
  const serialized = tx.serialize()
  console.log('REED serialized tx:', serialized)
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
  feePayerAccount,
  signatures
) => {
  const SOLANA_RPC_ENDPOINT = config.get('solanaEndpoint')
  const connection = new Connection(SOLANA_RPC_ENDPOINT)

  const lookupTableAddress = await createLookupTable(
    connection,
    instructions,
    feePayerAccount
  )

  await sleep(SLEEP_TIME)
  const lookupTableAccount = (
    await connection.getAddressLookupTable(lookupTableAddress)
  ).value
  console.log('REED got lookupTableAccount:', lookupTableAccount)
  if (!lookupTableAccount) {
    throw new Error(
      `Failed to get lookupTableAccount after waiting ${SLEEP_TIME} seconds`
    )
  }
  console.log('REED num addresses:', lookupTableAccount.state.addresses.length)
  for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
    const address = lookupTableAccount.state.addresses[i]
    console.log('REED addresses in account:', i, address.toBase58())
  }

  console.log('REED signatures:', signatures)
  const txId = await sendV0Transaction(
    connection,
    instructions,
    feePayerAccount,
    [lookupTableAccount],
    signatures
  )
  console.log(
    `REED successfully sent swap transaction: https://explorer.solana.com/tx/${txId}`
  )
}

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

module.exports = {
  sendTransactionWithLookupTable
}
