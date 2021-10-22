const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')

const models = require('../models')
const config = require('../config')
const { logger } = require('../logging')

const { primaryWeb3, secondaryWeb3 } = require('../web3')

// L2 relayerWallets
const relayerConfigs = config.get('relayerWallets')

const ENVIRONMENT = config.get('environment')
const MIN_GAS_PRICE = config.get('minGasPrice')
const HIGH_GAS_PRICE = config.get('highGasPrice')
const GANACHE_GAS_PRICE = config.get('ganacheGasPrice')
const DEFAULT_GAS_LIMIT = config.get('defaultGasLimit')

let relayerWallets = [...relayerConfigs] // will be array of { locked, publicKey, privateKey }
relayerWallets.forEach(wallet => {
  wallet.locked = false
})

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getGasPrice (logger, web3) {
  let gasPrice = parseInt(await web3.eth.getGasPrice())
  if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
    logger.info('txRelay - gas price was not defined or was greater than HIGH_GAS_PRICE', gasPrice)
    gasPrice = GANACHE_GAS_PRICE
  } else if (gasPrice === 0) {
    logger.info('txRelay - gas price was zero', gasPrice)
    // If the gas is zero, the txn will likely never get mined.
    gasPrice = MIN_GAS_PRICE
  } else if (gasPrice < MIN_GAS_PRICE) {
    logger.info('txRelay - gas price was less than MIN_GAS_PRICE', gasPrice)
    gasPrice = MIN_GAS_PRICE
  }
  gasPrice = '0x' + gasPrice.toString(16)

  return gasPrice
}

/** Attempt to send transaction to primary web3 provider, if that fails try secondary */
const sendTransaction = async (req, resetNonce = false, txProps, reqBodySHA) => {
  let resp = null
  try {
    resp = await sendTransactionInternal(req, primaryWeb3, txProps, reqBodySHA)
  } catch (e) {
    req.logger.error(`txRelay - sendTransaction Error - ${e}. Retrying with secondary web3.`)
    resp = await sendTransactionInternal(req, secondaryWeb3, txProps, reqBodySHA)
  }
  return resp
}

/**
 * TODO(roneilr): this should check that in the registry, contractRegistryKey maps to
 *  contractAddress, rejecting the tx if not. Also needs to maintain a whitelist of
 *  contracts (eg. storage contracts, discovery service contract, should not be allowed
 *  to relay TXes from here but can today).
 */
const sendTransactionInternal = async (req, web3, txProps, reqBodySHA) => {
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

  // decodedABI is set in the poaRelayWalletRateLimiter
  const decodedABI = req.decodedABI

  // will be set later. necessary for code outside scope of try block
  let txReceipt
  let redisLogParams
  let wallet = selectWallet()

  // If all wallets are currently in use, keep iterating until a wallet is freed up
  while (!wallet) {
    await delay(200)
    wallet = selectWallet()
  }

  try {
    req.logger.info(`L2 - txRelay - selected wallet ${wallet.publicKey} for sender ${senderAddress}`, decodedABI)
    const { receipt, txParams } = await createAndSendTransaction(wallet, contractAddress, '0x00', web3, req.logger, gasLimit, encodedABI)
    txReceipt = receipt

    redisLogParams = {
      date: Math.floor(Date.now() / 1000),
      reqBodySHA,
      txParams,
      senderAddress,
      nonce: txParams.nonce
    }
    await redis.zadd('relayTxAttempts', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
    req.logger.info(`L2 - txRelay - sending a transaction for wallet ${wallet.publicKey} to ${senderAddress}, req ${reqBodySHA}, gasPrice ${parseInt(txParams.gasPrice, 16)}, gasLimit ${gasLimit}, nonce ${txParams.nonce}`)

    await redis.zadd('relayTxSuccesses', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
    await redis.hset('txHashToSenderAddress', receipt.transactionHash, senderAddress)
  } catch (e) {
    req.logger.error('L2 - txRelay - Error in relay', e)
    await redis.zadd('relayTxFailures', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
    throw e
  } finally {
    wallet.locked = false
  }

  req.logger.info(`L2 - txRelay - success, req ${reqBodySHA}`)

  await models.Transaction.create({
    contractRegistryKey: contractRegistryKey,
    contractFn: decodedABI.name,
    contractAddress: contractAddress,
    senderAddress: senderAddress,
    encodedABI: encodedABI,
    decodedABI: decodedABI,
    receipt: txReceipt
  })

  return txReceipt
}

/**
 * Randomly select a wallet with a random offset. Circularly iterate through all
 * the available wallets using mod
 *
 * e.g. If there are 5 wallets available and the offset is at 2, iterate
 * in the order 2, 3, 4, 0, 1, and use const count to iterate through
 * all the available number of wallets
 */
const selectWallet = () => {
  let selectedWallet
  let i = Math.floor(Math.random() * relayerWallets.length) // random offset
  let count = 0 // num wallets to iterate through

  while (count++ < relayerWallets.length) {
    const wallet = relayerWallets[i++ % relayerWallets.length]

    if (!wallet.locked) {
      wallet.locked = true
      selectedWallet = wallet
      return selectedWallet
    }
  }
}

/**
 * Fund L2 wallets as necessary to facilitate multiple relayers
 */
const fundRelayerIfEmpty = async () => {
  const minimumBalance = primaryWeb3.utils.toWei(config.get('minimumBalance').toString(), 'ether')

  for (let wallet of relayerWallets) {
    let balance = await primaryWeb3.eth.getBalance(wallet.publicKey)
    logger.info('L2 - Attempting to fund wallet', wallet.publicKey, parseInt(balance))

    if (parseInt(balance) < minimumBalance) {
      logger.info(`L2 - Relay account below minimum expected. Attempting to fund ${wallet.publicKey}`)
      if (ENVIRONMENT === 'development') {
        const account = (await primaryWeb3.eth.getAccounts())[0] // local acc is unlocked and does not need private key
        logger.info(`L2 - transferring funds [${minimumBalance}] from ${account} to wallet ${wallet.publicKey}`)
        await primaryWeb3.eth.sendTransaction({ from: account, to: wallet.publicKey, value: minimumBalance })
      } else {
        logger.info(`relayerPublicKey: ${config.get('relayerPublicKey')}`)
        logger.info(`L2 - transferring funds [${minimumBalance}] from ${config.get('relayerPublicKey')} to wallet ${wallet.publicKey}`)
        const { receipt } = await createAndSendTransaction(
          {
            publicKey: config.get('relayerPublicKey'),
            privateKey: config.get('relayerPrivateKey')
          },
          wallet.publicKey,
          minimumBalance,
          primaryWeb3,
          logger
        )
        logger.info(`L2 - the transaction receipt ${JSON.stringify(receipt)}`)
      }

      balance = await getRelayerFunds(wallet.publicKey)
      logger.info('L2 - Balance of relay account:', wallet.publicKey, primaryWeb3.utils.fromWei(balance.toString(), 'ether'), 'eth')
    }
  }
}

// Send transaction using provided web3 object
const createAndSendTransaction = async (sender, receiverAddress, value, web3, logger, gasLimit = null, data = null) => {
  const privateKeyBuffer = Buffer.from(sender.privateKey, 'hex')
  const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
  const address = walletAddress.getAddressString()
  if (address !== sender.publicKey.toLowerCase()) {
    throw new Error('Invalid relayerPublicKey')
  }
  const gasPrice = await getGasPrice(logger, web3)
  const nonce = await web3.eth.getTransactionCount(address)
  gasLimit = gasLimit ? web3.utils.numberToHex(gasLimit) : DEFAULT_GAS_LIMIT
  let txParams = {
    nonce: web3.utils.toHex(nonce),
    gasPrice,
    gasLimit,
    to: receiverAddress,
    value: web3.utils.toHex(value)
  }
  logger.info(`Final params: ${JSON.stringify(txParams)}`)

  if (data) {
    txParams = { ...txParams, data }
  }

  const tx = new EthereumTx(txParams)
  tx.sign(privateKeyBuffer)
  const signedTx = '0x' + tx.serialize().toString('hex')
  console.log(`txRelay - sending a transaction for sender ${sender.publicKey} to ${receiverAddress}, gasPrice ${parseInt(gasPrice, 16)}, gasLimit ${DEFAULT_GAS_LIMIT}, nonce ${nonce}`)
  const receipt = await web3.eth.sendSignedTransaction(signedTx)
  return { receipt, txParams }
}

const getRelayerFunds = async (walletPublicKey) => {
  return primaryWeb3.eth.getBalance(walletPublicKey)
}

module.exports = {
  selectWallet,
  sendTransaction,
  getRelayerFunds,
  fundRelayerIfEmpty
}
