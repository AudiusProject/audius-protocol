const {
  SystemProgram,
  TransactionMessage,
  AddressLookupTableProgram,
  VersionedTransaction
} = require('@solana/web3.js')
const audiusLibsWrapper = require('../audiusLibsInstance')

const sendV0Transaction = async (connection, instructions, feePayerAccount) => {
  console.log('REED at top of sendV0Transaction')
  const slot = await connection.getSlot()
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: feePayerAccount.publicKey,
      payer: feePayerAccount.publicKey,
      recentSlot: slot
    })
  console.log('REED lookup table address:', lookupTableAddress.toBase58())

  const addresses = instructions.map((inst) => [...inst])
  console.log('REED addresses:', addresses)
  const extendInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: feePayerAccount.publicKey,
    authority: feePayerAccount.publicKey,
    lookupTable: lookupTableAddress,
    addresses: [
      feePayerAccount.publicKey,
      SystemProgram.programId,
      ...addresses
    ]
  })
  console.log('REED extend Instruction:', extendInstruction)
  extendInstruction.feePayerAccount = feePayerAccount.publicKey
  extendInstruction.sign(feePayerAccount)
  const extendTxId = await connection.sendRawTransaction(
    extendInstruction.serialize()
  )
  console.log(
    `Extend Transaction successfully sent: https://explorer.solana.com/tx/${extendTxId}`
  )

  const lookupTableAccount = await connection
    .getAddressLookupTable(lookupTableAddress)
    .then((res) => res.value)

  for (let i = 0; i < lookupTableAccount.state.addresses.length; i++) {
    const address = lookupTableAccount.state.addresses[i]
    console.log(i, address.toBase58())
  }

  const recentBlockhash = (await connection.getLatestBlockhash('confirmed'))
    .blockhash
  const messageV0 = new TransactionMessage({
    payerKey: feePayerAccount.publicKey,
    recentBlockhash,
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

module.exports = {
  sendV0Transaction
}
