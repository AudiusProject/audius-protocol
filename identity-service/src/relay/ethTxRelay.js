const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')
const axios = require('axios')
const config = require('../config')
const ethRelayerConfigs = config.get('ethRelayerWallets')
const { ethWeb3 } = require('../web3')
const { logger } = require('../logging')

const ENVIRONMENT = config.get('environment')
const DEFAULT_GAS_LIMIT = config.get('defaultGasLimit')
const GANACHE_GAS_PRICE = config.get('ganacheGasPrice')

// L1 relayer wallets
let ethRelayerWallets = [...ethRelayerConfigs] // will be array of { locked, publicKey, privateKey }
ethRelayerWallets.forEach(wallet => {
  wallet.locked = false
})

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Calculates index into eth relayer addresses
const getEthRelayerWalletIndex = (walletAddress) => {
  let walletParsedInteger = parseInt(walletAddress, 16)
  return walletParsedInteger % ethRelayerWallets.length
}

// Select from the list of eth relay wallet addresses
// Return the public key that will be used to relay this address
const queryEthRelayerWallet = (walletAddress) => {
  return ethRelayerWallets[getEthRelayerWalletIndex(walletAddress)].publicKey
}

// Query current balance for a given relayer public key
const getEthRelayerFunds = async (walletPublicKey) => {
  return ethWeb3.eth.getBalance(walletPublicKey)
}

const selectEthWallet = async (walletPublicKey, reqLogger) => {
  reqLogger.info(`L1 txRelay - Acquiring lock for ${walletPublicKey}`)
  let ethWalletIndex = getEthRelayerWalletIndex(walletPublicKey)
  while (ethRelayerWallets[ethWalletIndex].locked) {
    await delay(200)
  }
  ethRelayerWallets[ethWalletIndex].locked = true
  reqLogger.info(`L1 txRelay - Locking ${ethRelayerWallets[ethWalletIndex].publicKey}, index=${ethWalletIndex}}`)
  return {
    selectedEthRelayerWallet: ethRelayerWallets[ethWalletIndex],
    ethWalletIndex
  }
}

// Relay a transaction to the ethereum network
const sendEthTransaction = async (req, txProps, reqBodySHA) => {
  const {
    contractAddress,
    encodedABI,
    senderAddress,
    gasLimit
  } = txProps

  // Calculate relayer from senderAddress
  let { selectedEthRelayerWallet, ethWalletIndex } = await selectEthWallet(senderAddress, logger)
  req.logger.info(`L1 txRelay - selected relayerPublicWallet=${selectedEthRelayerWallet.publicKey}`)
  let ethGasPriceInfo = await getProdGasInfo(req.app.get('redis'), req.logger)

  // Select the 'fast' gas price
  let ethRelayGasPrice = ethGasPriceInfo[config.get('ethRelayerProdGasTier')]
  ethRelayGasPrice = ethRelayGasPrice * parseFloat(config.get('ethGasMultiplier'))

  let resp
  try {
    resp = await createAndSendEthTransaction(
      {
        publicKey: selectedEthRelayerWallet.publicKey,
        privateKey: selectedEthRelayerWallet.privateKey
      },
      contractAddress,
      '0x00',
      ethWeb3,
      req.logger,
      ethRelayGasPrice,
      gasLimit,
      encodedABI
    )
  } catch (e) {
    req.logger.error('L1 txRelay - Error in relay', e)
    throw e
  } finally {
    req.logger.info(`L1 txRelay - Unlocking ${ethRelayerWallets[ethWalletIndex].publicKey}, index=${ethWalletIndex}}`)
    // Unlock wallet
    ethRelayerWallets[ethWalletIndex].locked = false
  }

  req.logger.info(`L1 txRelay - success, req:${reqBodySHA}, sender:${senderAddress}`)
  return resp
}

const createAndSendEthTransaction = async (sender, receiverAddress, value, web3, logger, gasPrice, gasLimit = null, data = null) => {
  const privateKeyBuffer = Buffer.from(sender.privateKey, 'hex')
  const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
  const address = walletAddress.getAddressString()
  if (address !== sender.publicKey.toLowerCase()) {
    throw new Error(`L1 txRelay - Invalid relayerPublicKey found. Expected ${sender.publicKey.toLowerCase()}, found ${address}`)
  }
  const nonce = await web3.eth.getTransactionCount(address)
  let txParams = {
    nonce: web3.utils.toHex(nonce),
    gasPrice,
    gasLimit: gasLimit ? web3.utils.numberToHex(gasLimit) : DEFAULT_GAS_LIMIT,
    to: receiverAddress,
    value: web3.utils.toHex(value)
  }
  logger.info(`L1 txRelay - Final params: ${JSON.stringify(txParams)}`)
  if (data) {
    txParams = { ...txParams, data }
  }
  const tx = new EthereumTx(txParams)
  tx.sign(privateKeyBuffer)
  const signedTx = '0x' + tx.serialize().toString('hex')
  logger.info(`L1 txRelay - sending a transaction for sender ${sender.publicKey} to ${receiverAddress}, gasPrice ${parseInt(gasPrice, 16)}, gasLimit ${DEFAULT_GAS_LIMIT}, nonce ${nonce}`)
  const receipt = await web3.eth.sendSignedTransaction(signedTx)

  return { txHash: receipt.transactionHash, txParams }
}

// Query mainnet ethereum gas prices
/*
  Sample call:https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=some_key
*/
const getProdGasInfo = async (redis, logger) => {
  if (ENVIRONMENT === 'development') {
    return {
      fastGweiHex: GANACHE_GAS_PRICE,
      averageGweiHex: GANACHE_GAS_PRICE,
      fastestGweiHex: GANACHE_GAS_PRICE
    }
  }
  const prodGasPriceKey = 'eth-gas-prod-price-info'
  let gasInfo = await redis.get(prodGasPriceKey)
  if (!gasInfo) {
    logger.info(`Redis cache miss, querying remote`)
    let prodGasInfo
    let defiPulseKey = config.get('defiPulseApiKey')
    if (defiPulseKey !== '') {
      logger.info(`L1 txRelay querying ethGas with apiKey`)
      prodGasInfo = await axios({
        method: 'get',
        url: `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${defiPulseKey}`
      })
    } else {
      prodGasInfo = await axios({
        method: 'get',
        url: 'https://ethgasstation.info/api/ethgasAPI.json'
      })
    }
    let { fast, fastest, safeLow, average } = prodGasInfo.data
    gasInfo = { fast, fastest, safeLow, average }
    // Convert returned values into gwei to be used during relay and cache
    // Must divide by 10 to get gwei price (Math.pow(10, 9) -> Math.pow(10, 8))
    // https://docs.ethgasstation.info/gas-price
    gasInfo.fastGwei = (parseInt(gasInfo.fast) * Math.pow(10, 8))
    gasInfo.fastestGwei = (parseInt(gasInfo.fastest) * Math.pow(10, 8))
    gasInfo.averageGwei = (parseInt(gasInfo.average) * Math.pow(10, 8))
    gasInfo.fastGweiHex = ethWeb3.utils.numberToHex(gasInfo.fastGwei)
    gasInfo.fastestGweiHex = ethWeb3.utils.numberToHex(gasInfo.fastestGwei)
    gasInfo.averageGweiHex = ethWeb3.utils.numberToHex(gasInfo.averageGwei)
    gasInfo.cachedResponse = false
    redis.set(prodGasPriceKey, JSON.stringify(gasInfo), 'EX', 30)
    logger.info(`L1 txRelay - Updated gasInfo: ${JSON.stringify(gasInfo)}`)
  } else {
    gasInfo = JSON.parse(gasInfo)
    gasInfo.cachedResponse = true
  }
  return gasInfo
}

/**
 * Fund L1 wallets as necessary to facilitate multiple relayers
 */
const fundEthRelayerIfEmpty = async () => {
  const minimumBalance = ethWeb3.utils.toWei(config.get('ethMinimumBalance').toString(), 'ether')
  for (let ethWallet of ethRelayerWallets) {
    let ethWalletPublicKey = ethWallet.publicKey
    let balance = await ethWeb3.eth.getBalance(ethWalletPublicKey)
    logger.info(`L1 txRelay - balance for ethWalletPublicKey ${ethWalletPublicKey}: ${balance}, minimumBalance: ${minimumBalance}`)
    let validBalance = parseInt(balance) >= minimumBalance
    if (ENVIRONMENT === 'development') {
      if (!validBalance) {
        const account = (await ethWeb3.eth.getAccounts())[0] // local acc is unlocked and does not need private key
        logger.info(`L1 txRelay - transferring funds [${minimumBalance}] from ${account} to wallet ${ethWalletPublicKey}`)
        await ethWeb3.eth.sendTransaction({ from: account, to: ethWalletPublicKey, value: minimumBalance })
        logger.info(`L1 txRelay - transferred funds [${minimumBalance}] from ${account} to wallet ${ethWalletPublicKey}`)
      } else {
        logger.info(`L1 txRelay - ${ethWalletPublicKey} has valid balance ${balance}, minimum:${minimumBalance}`)
      }
    } else {
      // In non-development environments, ethRelay wallets must be funded prior to deployment of this service
      // Automatic funding in L1 environment is TBD
      logger.info(`L1 txRelay -  ${ethWalletPublicKey} below minimum balance`)
      throw new Error(`Invalid balance for ethRelayer account ${ethWalletPublicKey}. Found ${balance}, required minimumBalance ${minimumBalance}`)
    }
  }
}

module.exports = {
  fundEthRelayerIfEmpty,
  sendEthTransaction,
  queryEthRelayerWallet,
  getEthRelayerFunds,
  getProdGasInfo
}
