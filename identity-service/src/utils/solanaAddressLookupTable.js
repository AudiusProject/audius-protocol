const {
  SystemProgram,
  TransactionMessage,
  AddressLookupTableProgram,
  VersionedTransaction
} = require('@solana/web3.js')

const MAX_RETRIES = 5

const sendV0Transaction = async (connection, instructions, feePayerAccount) => {
  const recentBlockhash = await connection.getLatestBlockhash('finalized')
  const message = new TransactionMessage({
    payerKey: feePayerAccount.publicKey,
    recentBlockhash,
    instructions
  }).compileToV0Message()
  console.log('REED message created:', message)
  const tx = new VersionedTransaction(message)
  console.log('REED tx created:', tx)
  tx.sign([feePayerAccount])
  console.log('REED tx signed:', tx)
  const serialized = tx.serialize()
  console.log('REED tx serialized:', serialized)
  const txId = await connection.sendRawTransaction(serialized, {
    max_retries: MAX_RETRIES
  })
  console.log('REED tx sent:', txId)

  const confirmation = await connection.confirmTransaction({
    signature: txId,
    blockhash: recentBlockhash.blockhash,
    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
  })
  if (confirmation.value.err) {
    throw new Error('V0 Transaction not confirmed: txId', txId)
  }
  console.log('REED tx confirmed:', confirmation)
}

const sendTransactionWithLookupTable = async (
  connection,
  instructions,
  feePayerAccount
) => {
  const slot = await connection.getSlot('finalized')
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: feePayerAccount.publicKey,
      payer: feePayerAccount.publicKey,
      recentSlot: slot
    })
  console.log('REED lookup table address:', lookupTableAddress.toBase58())
  const createTableTxId = await sendV0Transaction(
    connection,
    [lookupTableInst],
    feePayerAccount
  )
  console.log('REED successfully created table:', createTableTxId)

  const set = new Set()
  instructions.forEach((i) => i.keys.map((k) => set.add(k.pubkey)))
  const addresses = Array.from(set)
  const halfIndex = Math.floor(addresses.length / 2)
  const firstHalf = addresses.slice(0, halfIndex)
  const secondHalf = addresses.slice(halfIndex)
  const extendInstructionFirstHalf =
    AddressLookupTableProgram.extendLookupTable({
      payer: feePayerAccount.publicKey,
      authority: feePayerAccount.publicKey,
      lookupTable: lookupTableAddress,
      addresses: [
        feePayerAccount.publicKey,
        SystemProgram.programId,
        ...firstHalf
      ]
    })
  const txIdFirstHalf = await sendV0Transaction(
    connection,
    [extendInstructionFirstHalf],
    feePayerAccount
  )
  console.log(
    'REED successfully sent table transaction first half',
    txIdFirstHalf
  )

  const extendInstructionSecondHalf =
    AddressLookupTableProgram.extendLookupTable({
      payer: feePayerAccount.publicKey,
      authority: feePayerAccount.publicKey,
      lookupTable: lookupTableAddress,
      addresses: secondHalf
    })

  console.log('REED second half instruction:', extendInstructionSecondHalf)
  const txIdSecondHalf = await sendV0Transaction(
    connection,
    [extendInstructionSecondHalf],
    feePayerAccount
  )
  console.log(
    'REED successfully sent table transaction second half',
    txIdSecondHalf
  )

  const lookupTableAccount = await connection
    .getAddressLookupTable(lookupTableAddress)
    .then((res) => res.value)

  sleep(1)
  console.log('REED num addresses:', lookupTableAccount.state.addresses.length)
  for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
    const address = lookupTableAccount.state.addresses[i]
    console.log('REED addresses in account:', i, address.toBase58())
  }

  const recentBlockhashV0 = (await connection.getLatestBlockhash('finalized'))
    .blockhash
  const messageV0 = new TransactionMessage({
    payerKey: feePayerAccount.publicKey,
    recentBlockhash: recentBlockhashV0,
    instructions // note this is an array of instructions
  }).compileToV0Message([lookupTableAccount])

  // create a v0 transaction from the v0 message
  const transactionV0 = new VersionedTransaction(messageV0)

  // sign the v0 transaction using the file system wallet we created named `payer`
  transactionV0.sign([feePayerAccount])
  transactionV0.serialize()

  // send and confirm the transaction
  // (NOTE: There is NOT an array of Signers here; see the note below...)
  const txid = await connection.sendRawTransaction(transactionV0)

  console.log(`Transaction: https://explorer.solana.com/tx/${txid}`)
}

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

module.exports = {
  sendTransactionWithLookupTable
}
