const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')
const Accounts = require('web3-eth-accounts')

const models = require('../models')
const config = require('../config')
const { logger } = require('../logging')
const { Lock } = require('../redis')

const { libs } = require('@audius/sdk')
const AudiusABIDecoder = libs.AudiusABIDecoder
const { primaryWeb3, nethermindWeb3, secondaryWeb3 } = require('../web3')

// L2 relayerWallets
const relayerWallets = config.get('relayerWallets') // { publicKey, privateKey }

const ENVIRONMENT = config.get('environment')
const MIN_GAS_PRICE = config.get('minGasPrice')
const HIGH_GAS_PRICE = config.get('highGasPrice')
const GANACHE_GAS_PRICE = config.get('ganacheGasPrice')
const DEFAULT_GAS_LIMIT = config.get('defaultGasLimit')
const UPDATE_REPLICA_SET_RECONFIGURATION_LIMIT = config.get(
  'updateReplicaSetReconfigurationLimit'
)
const UPDATE_REPLICA_SET_WALLET_WHITELIST = config.get(
  'updateReplicaSetWalletWhitelist'
)

const transactionRateLimiter = {
  updateReplicaSetReconfiguration: 0
}

setInterval(() => {
  transactionRateLimiter.updateReplicaSetReconfiguration = 0
}, 10000)

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const generateWalletLockKey = (publicKey) => `POA_RELAYER_WALLET:${publicKey}`

async function getGasPrice(logger, web3) {
  let gasPrice = parseInt(await web3.eth.getGasPrice())
  if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
    logger.info(
      'txRelay - gas price was not defined or was greater than HIGH_GAS_PRICE',
      gasPrice
    )
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
const sendTransaction = async (
  req,
  resetNonce = false,
  txProps,
  reqBodySHA
) => {
  let resp = null
  try {
    resp = await sendTransactionInternal(req, primaryWeb3, txProps, reqBodySHA)
  } catch (e) {
    req.logger.error(
      `txRelay - sendTransaction Error - ${e}. Retrying with secondary web3.`
    )
    resp = await sendTransactionInternal(
      req,
      secondaryWeb3,
      txProps,
      reqBodySHA
    )
  }
  return resp
}

const sendTransactionInternal = async (req, web3, txProps, reqBodySHA) => {
  const {
    contractRegistryKey,
    contractAddress,
    encodedABI,
    senderAddress,
    gasLimit
  } = txProps
  const redis = req.app.get('redis')

  // SEND to either POA or Nethermind here...
  let sendToNethermind = false
  if (config.get('environment') === 'staging') {
    sendToNethermind = true
  } else {
    const currentBlock = await web3.eth.getBlockNumber()
    const finalPOABlock = config.get('finalPOABlock')
    sendToNethermind = finalPOABlock ? currentBlock > finalPOABlock : false
  }

  const existingTx = await models.Transaction.findOne({
    where: {
      encodedABI: encodedABI // this should always be unique because of the nonce / sig
    }
  })

  // if this transaction has already been submitted before and succeeded, send this receipt
  if (existingTx) {
    return existingTx.receipt
  }

  const contractName =
    contractRegistryKey.charAt(0).toUpperCase() + contractRegistryKey.slice(1) // uppercase the first letter
  const decodedABI = AudiusABIDecoder.decodeMethod(contractName, encodedABI)

  filterReplicaSetUpdates(decodedABI, senderAddress)

  // will be set later. necessary for code outside scope of try block
  let txReceipt
  let txParams
  let redisLogParams
  let wallet = await selectWallet()

  // If all wallets are currently in use, keep iterating until a wallet is freed up
  while (!sendToNethermind && !wallet) {
    await delay(200)
    wallet = await selectWallet()
  }

  try {
    req.logger.info(
      `L2 - txRelay - selected wallet ${wallet.publicKey} for sender ${senderAddress}`
    )

    if (sendToNethermind) {
      const ok = await relayToNethermind(encodedABI)
      txParams = ok.txParams
      txReceipt = ok.receipt
    } else {
      // use POA receipt as main receipt
      const ok = await createAndSendTransaction(
        wallet,
        contractAddress,
        '0x00',
        web3,
        req.logger,
        gasLimit,
        encodedABI
      )
      txParams = ok.txParams
      txReceipt = ok.receipt
    }

    redisLogParams = {
      date: Math.floor(Date.now() / 1000),
      reqBodySHA,
      txParams,
      senderAddress,
      nonce: txParams.nonce
    }
    await redis.zadd(
      'relayTxAttempts',
      Math.floor(Date.now() / 1000),
      JSON.stringify(redisLogParams)
    )
    req.logger.info(
      `L2 - txRelay - sending a transaction for wallet ${
        wallet.publicKey
      } to ${senderAddress}, req ${reqBodySHA}, gasPrice ${parseInt(
        txParams.gasPrice,
        16
      )}, gasLimit ${gasLimit}, nonce ${txParams.nonce}`
    )

    await redis.zadd(
      'relayTxSuccesses',
      Math.floor(Date.now() / 1000),
      JSON.stringify(redisLogParams)
    )
    await redis.hset(
      'txHashToSenderAddress',
      txReceipt.transactionHash,
      senderAddress
    )
  } catch (e) {
    req.logger.error('L2 - txRelay - Error in relay', e)
    await redis.zadd(
      'relayTxFailures',
      Math.floor(Date.now() / 1000),
      JSON.stringify(redisLogParams)
    )
    throw e
  } finally {
    await Lock.clearLock(generateWalletLockKey(wallet.publicKey))
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
 * Rate limit replica set reconfiguration transactions
 * the available wallets using mod
 *
 * A reconfiguration (as opposed to a first time selection) will have an
 * _oldPrimaryId value of "0"
 */

const filterReplicaSetUpdates = (decodedABI, senderAddress) => {
  let isReplicaSetTransaction = false
  let isFirstReplicaSetConfig = false

  if (decodedABI.name === 'updateReplicaSet') {
    // TODO remove legacy replica set updates
    isFirstReplicaSetConfig = decodedABI.params.find(
      (param) => param.name === '_oldPrimaryId' && param.value === '0'
    )
  } else if (decodedABI.name === 'manageEntity') {
    isReplicaSetTransaction = decodedABI.params.find(
      (param) =>
        param.name === '_entityType' && param.value === 'UserReplicaSet'
    )
    // isFirstReplicaSetConfig must be false
    // EntityManager create user actions include the initial replica set
  }

  if (isReplicaSetTransaction && !isFirstReplicaSetConfig) {
    transactionRateLimiter.updateReplicaSetReconfiguration += 1
    if (
      transactionRateLimiter.updateReplicaSetReconfiguration >
      UPDATE_REPLICA_SET_RECONFIGURATION_LIMIT
    ) {
      throw new Error('updateReplicaSet rate limit reached')
    }

    if (
      UPDATE_REPLICA_SET_WALLET_WHITELIST.length > 0 &&
      !UPDATE_REPLICA_SET_WALLET_WHITELIST.includes(senderAddress)
    ) {
      throw new Error(
        `Sender ${senderAddress} not allowed to make updateReplicaSet calls`
      )
    }
  }
}

/**
 * Randomly select a wallet with a random offset. Circularly iterate through all
 * the available wallets using mod
 *
 * e.g. If there are 5 wallets available and the offset is at 2, iterate
 * in the order 2, 3, 4, 0, 1, and use const count to iterate through
 * all the available number of wallets
 */
const selectWallet = async () => {
  let i = Math.floor(Math.random() * relayerWallets.length) // random offset
  let count = 0 // num wallets to iterate through

  while (count++ < relayerWallets.length) {
    const wallet = relayerWallets[i++ % relayerWallets.length]
    try {
      const locked = await Lock.setLock(generateWalletLockKey(wallet.publicKey))
      if (locked) return wallet
    } catch (e) {
      logger.error('Error selecting POA wallet for txRelay, reselecting', e)
    }
  }
}

/**
 * Fund L2 wallets as necessary to facilitate multiple relayers
 */
const fundRelayerIfEmpty = async () => {
  const minimumBalance = primaryWeb3.utils.toWei(
    config.get('minimumBalance').toString(),
    'ether'
  )

  for (const wallet of relayerWallets) {
    let balance = await primaryWeb3.eth.getBalance(wallet.publicKey)
    logger.info(
      'L2 - Attempting to fund wallet',
      wallet.publicKey,
      parseInt(balance)
    )

    if (parseInt(balance) < minimumBalance) {
      logger.info(
        `L2 - Relay account below minimum expected. Attempting to fund ${wallet.publicKey}`
      )
      if (ENVIRONMENT === 'development') {
        const account = (await primaryWeb3.eth.getAccounts())[0] // local acc is unlocked and does not need private key
        logger.info(
          `L2 - transferring funds [${minimumBalance}] from ${account} to wallet ${wallet.publicKey}`
        )
        await primaryWeb3.eth.sendTransaction({
          from: account,
          to: wallet.publicKey,
          value: minimumBalance
        })
      } else {
        logger.info(`relayerPublicKey: ${config.get('relayerPublicKey')}`)
        logger.info(
          `L2 - transferring funds [${minimumBalance}] from ${config.get(
            'relayerPublicKey'
          )} to wallet ${wallet.publicKey}`
        )
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
      logger.info(
        'L2 - Balance of relay account:',
        wallet.publicKey,
        primaryWeb3.utils.fromWei(balance.toString(), 'ether'),
        'eth'
      )
    }
  }
}

// Send transaction using provided web3 object
const createAndSendTransaction = async (
  sender,
  receiverAddress,
  value,
  web3,
  logger,
  gasLimit = null,
  data = null
) => {
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
  console.log(
    `txRelay - sending a transaction for sender ${
      sender.publicKey
    } to ${receiverAddress}, gasPrice ${parseInt(
      gasPrice,
      16
    )}, gasLimit ${DEFAULT_GAS_LIMIT}, nonce ${nonce}`
  )
  const receipt = await web3.eth.sendSignedTransaction(signedTx)
  return { receipt, txParams }
}

//
// Relay txn to nethermind
//

let inFlight = 0

async function relayToNethermind(encodedABI) {
  // generate a new private key per transaction (gas is free)
  const accounts = new Accounts(config.get('nethermindWeb3Provider'))

  const wallet = accounts.create()
  const privateKey = wallet.privateKey.substring(2)
  const start = new Date().getTime()

  try {
    const transaction = {
      to: config.get('entityManagerAddress'),
      value: 0,
      gas: '100880',
      gasPrice: 0,
      data: encodedABI
    }

    const signedTx = await nethermindWeb3.eth.accounts.signTransaction(
      transaction,
      privateKey
    )

    inFlight++
    const myDepth = inFlight

    logger.info(
      `relayToNethermind sending txhash: ${signedTx.transactionHash} num: ${myDepth}`
    )

    const receipt = await nethermindWeb3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    )
    receipt.blockNumber += config.get('finalPOABlock')

    const end = new Date().getTime()
    const took = end - start
    inFlight--
    logger.info(
      `relayToNethermind ok txhash: ${signedTx.transactionHash} num: ${myDepth} took: ${took} pending: ${inFlight}`
    )
    return {
      txParams: transaction,
      receipt
    }
  } catch (err) {
    console.log('relayToNethermind error:', err.toString())
    throw err
  }
}

const getRelayerFunds = async (walletPublicKey) => {
  return primaryWeb3.eth.getBalance(walletPublicKey)
}

module.exports = {
  selectWallet,
  sendTransaction,
  getRelayerFunds,
  fundRelayerIfEmpty,
  generateWalletLockKey
}
