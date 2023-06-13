let { generators, getNonce } = require('../signature_schemas/signatureSchemas')
let sigUtil = require('eth-sig-util')
let { Buffer } = require('safe-buffer')
let entityManagerABI = require('../build/contracts/EntityManager.json')
var Contract = require('web3-eth-contract')

async function main() {
  try {
    let entityManagerAddress = process.env.ENTITY_MANAGER_ADDRESS
    let privateKey = process.env.SENDER_PRIVATE_KEY
    let senderAccount = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
    let contract = new Contract(entityManagerABI.abi, entityManagerAddress)

    /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
    while (true) {
      let chainId = 1056800
      let userId = 1
      let entityType = 'Track'
      let entityId = 2
      let action = 'Save'
      let metadataMultihash = ''
      let txCount = await web3.eth.getTransactionCount(senderAccount.address)
      console.log('txCount', txCount)
      let sigNonce = getNonce()
      let signatureData = generators.getManageEntityData(
        chainId,
        entityManagerAddress,
        userId,
        entityType,
        entityId,
        action,
        metadataMultihash,
        sigNonce
      )
      let sig = sigUtil.signTypedData(Buffer.from(privateKey, 'hex'), {
        data: signatureData
      })
      let method = contract.methods
        .manageEntity(
          userId,
          entityType,
          entityId,
          action,
          metadataMultihash,
          sigNonce,
          sig
        )
        .encodeABI()

      let transaction = {
        to: entityManagerAddress,
        value: 0,
        gas: '100880', // some high gas value
        nonce: txCount,
        data: method
      }
      let signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey
      )
      console.log('sending tx')
      let receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      )
      console.log('receipt', receipt.transactionHash)
    }
  } catch (err) {
    console.log('error', err)
  }
}

module.exports = async function (callback) {
  await main()
  callback()
}
