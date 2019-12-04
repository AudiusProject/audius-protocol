const Web3 = require('web3')
const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')

const models = require('./models')
const config = require('./config')
const { logger } = require('./logging')

const { AudiusABIDecoder } = require('@audius/libs')

const web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))

const MIN_GAS_PRICE = Math.pow(10, 9) // 1 GWei, POA default gas price
const HIGH_GAS_PRICE = 5 * MIN_GAS_PRICE // 5 GWei
const GANACHE_GAS_PRICE = 39062500000 // ganache gas price is extremely high, so we hardcode a lower value (0x09184e72a0 from docs here)

// 1011968 is used by default
const DEFAULT_GAS_LIMIT = '0xf7100'

// this is incremented by the code below, but will not work as expected if there are
// multiple instances of the identity service using the same Ethereum account
let currentRelayerAccountNonce
let nonceLocked = false

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const sendTransaction = async (
  contractRegistryKey,
  contractAddress,
  encodedABI,
  senderAddress,
  resetNonce = false,
  txGasLimit = null) => {
  // TODO(roneilr): this should check that in the registry, contractRegistryKey maps to
  // contractAddress, rejecting the tx if not. Also needs to maintain a whitelist of
  // contracts (eg. storage contracts, discovery service contract, should not be allowed
  // to relay TXes from here but can today).

  const existingTx = await models.Transaction.findOne({
    where: {
      encodedABI: encodedABI // this should always be unique because of the nonce / sig
    }
  })

  // if this transaction has already been submitted before and succeeded, send this receipt
  if (existingTx) {
    return existingTx.receipt
  }

  const contractName = contractRegistryKey.charAt(0).toUpperCase() + contractRegistryKey.slice(1) // uppercase the first letter
  const decodedABI = AudiusABIDecoder.decodeMethod(contractName, encodedABI)

  const privateKeyBuffer = Buffer.from(config.get('relayerPrivateKey'), 'hex')
  const wallet = EthereumWallet.fromPrivateKey(privateKeyBuffer)
  const address = wallet.getAddressString()
  if (address !== config.get('relayerPublicKey').toLowerCase()) {
    throw new Error('Invalid relayerPublicKey')
  }

  let gasPrice = parseInt(await web3.eth.getGasPrice())
  if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
    gasPrice = GANACHE_GAS_PRICE
  } else if (gasPrice === 0) {
    // If the gas is zero, the txn will likely never get mined.
    gasPrice = MIN_GAS_PRICE
  }
  gasPrice = '0x' + gasPrice.toString(16)

  // crude spinlock
  while (nonceLocked) { // eslint-disable-line
    await delay(200) // poll lock every 200ms
  }
  nonceLocked = true
  let receiptPromise = null

  try {
    if (resetNonce) currentRelayerAccountNonce = null

    if (!currentRelayerAccountNonce) {
      const txCount = await web3.eth.getTransactionCount(address)
      currentRelayerAccountNonce = txCount
    }

    const currentNonce = currentRelayerAccountNonce
    const txParams = {
      nonce: web3.utils.toHex(currentNonce),
      gasPrice: gasPrice,
      gasLimit: txGasLimit ? web3.utils.numberToHex(txGasLimit) : DEFAULT_GAS_LIMIT,
      to: contractAddress,
      data: encodedABI,
      value: '0x00'
    }

    const tx = new EthereumTx(txParams)
    tx.sign(privateKeyBuffer)

    const signedTx = '0x' + tx.serialize().toString('hex')

    // once we have a transaction hash back, we know the nonce has been used. If we do
    // not get a tx hash back, the nonce is still available for use by others. For this
    // reason, we wait for this promise to resolve with a tx hash before incrementing
    // the current nonce)
    receiptPromise = web3.eth.sendSignedTransaction(signedTx)
    const prom = new Promise(function (resolve, reject) {
      let resolved = false
      receiptPromise.once('transactionHash', function (hash) {
        resolved = true
        resolve(hash)
      }).on('error', function (error) {
        if (!resolved) {
          reject(error)
        }
      })
    })
    await prom // resolves when a hash exists for a transaction, proving that it has not errored
    currentRelayerAccountNonce++
  } finally {
    nonceLocked = false
  }

  const receipt = await receiptPromise

  await models.Transaction.create({
    contractRegistryKey: contractRegistryKey,
    contractFn: decodedABI.name,
    contractAddress: contractAddress,
    senderAddress: senderAddress,
    encodedABI: encodedABI,
    decodedABI: decodedABI,
    receipt: receipt
  })

  return receipt
}

const fundRelayerIfEmpty = async () => {
  let balance = await getRelayerFunds()
  const minimumBalance = web3.utils.toWei(config.get('minimumBalance').toString(), 'ether')
  if (parseInt(balance) < minimumBalance) {
    logger.info('Relay account below minimum expected. Attempting to fund...')
    const account = (await web3.eth.getAccounts())[0]
    await web3.eth.sendTransaction({ from: account, to: config.get('relayerPublicKey'), value: minimumBalance })
    logger.info('Successfully funded relay account!')
    balance = await getRelayerFunds()
  }
  logger.info('Balance of relay account:', web3.utils.fromWei(balance, 'ether'), 'eth')
}

const getRelayerFunds = async () => {
  return web3.eth.getBalance(config.get('relayerPublicKey'))
}

module.exports = { sendTransaction, getRelayerFunds, fundRelayerIfEmpty }
