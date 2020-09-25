const Web3 = require('web3')
const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')

const models = require('./models')
const config = require('./config')
const { logger } = require('./logging')

const { AudiusABIDecoder } = require('@audius/libs')

const primaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
const secondaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('secondaryWeb3Provider')))

const MIN_GAS_PRICE = config.get('minGasPrice')
const HIGH_GAS_PRICE = config.get('highGasPrice')
const GANACHE_GAS_PRICE = config.get('ganacheGasPrice')
const DEFAULT_GAS_LIMIT = config.get('defaultGasLimit')

// multiple instances of the identity service using the same Ethereum account
let currentRelayerAccountNonce
let nonceLocked = false

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getGasPrice (req, web3) {
  let gasPrice = parseInt(await web3.eth.getGasPrice())
  if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
    req.logger.info('txRelay - gas price was not defined or was greater than HIGH_GAS_PRICE', gasPrice)
    gasPrice = GANACHE_GAS_PRICE
  } else if (gasPrice === 0) {
    req.logger.info('txRelay - gas price was zero', gasPrice)
    // If the gas is zero, the txn will likely never get mined.
    gasPrice = MIN_GAS_PRICE
  } else if (gasPrice < MIN_GAS_PRICE) {
    req.logger.info('txRelay - gas price was less than MIN_GAS_PRICE', gasPrice)
    gasPrice = MIN_GAS_PRICE
  }
  gasPrice = '0x' + gasPrice.toString(16)

  return gasPrice
}

/** Attempt to send transaction to primary web3 provider, if that fails try secondary */
const sendTransaction = async (req, resetNonce = false, txProps, reqBodySHA) => {
  let resp = null
  try {
    resp = await sendTransactionInternal(req, primaryWeb3, resetNonce, txProps, reqBodySHA)
  } catch (e) {
    req.logger.error(`txRelay - sendTransaction Error - ${e}. Retrying with secondary web3.`)
    resp = await sendTransactionInternal(req, secondaryWeb3, resetNonce, txProps, reqBodySHA)
  }
  return resp
}

/**
 * TODO(roneilr): this should check that in the registry, contractRegistryKey maps to
 *  contractAddress, rejecting the tx if not. Also needs to maintain a whitelist of
 *  contracts (eg. storage contracts, discovery service contract, should not be allowed
 *  to relay TXes from here but can today).
 */
const sendTransactionInternal = async (req, web3, resetNonce = false, txProps, reqBodySHA) => {
  const {
    contractRegistryKey,
    contractAddress,
    encodedABI,
    senderAddress,
    gasLimit
  } = txProps
  const redis = req.app.get('redis')

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

  const gasPrice = await getGasPrice(req, web3)

  req.logger.info(`txRelay - Acquiring nonce lock for ${JSON.stringify(decodedABI)}`)
  const startTime = new Date()
  // crude spinlock
  while (nonceLocked) { // eslint-disable-line
    await delay(200) // poll lock every 200ms
  }
  nonceLocked = true
  const timeLocked = new Date() - startTime
  req.logger.info(`txRelay - Acquired nonce lock in ${timeLocked} for ${JSON.stringify(decodedABI)}`)

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
      gasLimit: gasLimit ? web3.utils.numberToHex(gasLimit) : DEFAULT_GAS_LIMIT,
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
    const redisLogParams = {
      date: Math.floor(Date.now() / 1000),
      reqBodySHA,
      txParams,
      senderAddress,
      currentNonce
    }
    await redis.zadd('relayTxAttempts', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
    req.logger.info(`txRelay - sending a transaction for wallet ${senderAddress}, req ${reqBodySHA}, gasPrice ${parseInt(gasPrice, 16)}, gasLimit ${gasLimit}, nonce ${currentNonce}`)

    receiptPromise = web3.eth.sendSignedTransaction(signedTx)
    // use a promi-event for this web3 call
    // https://web3js.readthedocs.io/en/v1.2.0/callbacks-promises-events.html#promievent
    const prom = new Promise(function (resolve, reject) {
      let resolved = false
      receiptPromise.once('transactionHash', async function (hash) {
        req.logger.info(`txRelay - received transaction hash ${hash} for sender ${senderAddress}`)
        await redis.hset('txHashToSenderAddress', hash, senderAddress)
        resolved = true
        resolve(hash)
      }).on('error', async function (error) {
        if (!resolved) {
          req.logger.error(`txRelay - error getting transaction receipt ${error}`)
          await redis.zadd('relayTxFailures', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
          reject(error)
        }
      })
    })

    await prom // resolves when a hash exists for a transaction, proving that it has not errored
    await redis.zadd('relayTxSuccesses', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
    currentRelayerAccountNonce++
  } finally {
    nonceLocked = false
  }

  // if this promise resolves, it continues to the next step
  // if it errors, the reject is caught by the calling function in the try/catch and handled
  const startTimeReceipt = new Date()
  const receipt = await receiptPromise
  const timeReceipt = new Date() - startTimeReceipt
  req.logger.info(`txRelay - Received recript in ${timeReceipt} for ${JSON.stringify(receipt)}`)

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
  const minimumBalance = primaryWeb3.utils.toWei(config.get('minimumBalance').toString(), 'ether')
  if (parseInt(balance) < minimumBalance) {
    logger.info('Relay account below minimum expected. Attempting to fund...')
    const account = (await primaryWeb3.eth.getAccounts())[0]
    await primaryWeb3.eth.sendTransaction({ from: account, to: config.get('relayerPublicKey'), value: minimumBalance })
    logger.info('Successfully funded relay account!')
    balance = await getRelayerFunds()
  }
  logger.info('Balance of relay account:', primaryWeb3.utils.fromWei(balance, 'ether'), 'eth')
}

const getRelayerFunds = async () => {
  return primaryWeb3.eth.getBalance(config.get('relayerPublicKey'))
}

module.exports = { sendTransaction, getRelayerFunds, fundRelayerIfEmpty }
