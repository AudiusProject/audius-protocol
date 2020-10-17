const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')
const axios = require('axios')
const config = require('../config')
const ethRelayerConfigs = config.get('ethRelayerWallets')
const { ethWeb3 } = require('../web3')

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

const getEthRelayerFunds = async (walletPublicKey) => {
    return ethWeb3.eth.getBalance(walletPublicKey)
}

const selectEthWallet = async (walletPublicKey) => {
  // TIMEOUT
  let resolvedIndex = getEthRelayerWalletIndex(walletPublicKey)
  while (ethRelayerWallets[index].locked) {
    await delay(200)
  }
  // RIPE FOR MULTIPLE ENTRANCY ISSUES AND IS THREAD UNSAFE
  ethRelayerWallets.locked = true
  return ethRelayerWallets[resolvedIndex]
}

// Relay a transaction to the ethereum network
const sendEthTransaction = async (req, txProps, reqBodySHA) => {
    const {
      contractAddress,
      encodedABI,
      senderAddress,
      gasLimit
    } = txProps

    // Calculate relayer from  senderAddressjo
    let selectedEthRelayerWallet = await selectEthWallet(senderAddress)
    req.logger.info(`L1 txRelay - selected relayerIndex=${relayerIndex}, relayerPublicWallet=${selectedEthRelayerWallet.publicKey}`)
    let ethGasPriceInfo = await getProdGasInfo(req.app.get('redis'), req.logger)

    // Select the 'fast' gas price
    let ethRelayGasPrice = ethGasPriceInfo.fastGweiHex
    let txReceipt = await createAndSendTransaction(
      {
        publicKey: selectedEthRelayerWallet.publicKey,
        privateKey: selectedEthRelayerWallet.privateKey
      },
      contractAddress,
      '0x00',
      ethWeb3,
      req.logger,
      gasLimit,
      encodedABI,
      ethRelayGasPrice
    )

    txReceipt.selectedRelayIndex = relayerIndex
    txReceipt.selectedRelay = selectedEthRelayerWallet
    req.logger.info(`L1 txRelay - success, req:${reqBodySHA}, sender:${senderAddress}`)
    return txReceipt
}

const createAndSendTransaction = async (sender, receiverAddress, value, web3, logger, gasLimit = null, data = null, inputGasPrice = null) => {
    const privateKeyBuffer = Buffer.from(sender.privateKey, 'hex')
    const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
    const address = walletAddress.getAddressString()

    if (address !== sender.publicKey.toLowerCase()) {
        throw new Error('Invalid relayerPublicKey')
    }
    let gasPrice
    if (inputGasPrice) {
        gasPrice = inputGasPrice
    } else {
        gasPrice = await getGasPrice(logger, web3)
    }

    const nonce = await web3.eth.getTransactionCount(address)
    let txParams = {
        nonce: web3.utils.toHex(nonce),
        gasPrice,
        gasLimit: gasLimit ? web3.utils.numberToHex(gasLimit) : DEFAULT_GAS_LIMIT,
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

    console.log(`rawGasPrice: ${gasPrice}`)
    console.log(`txRelay - sending a transaction for sender ${sender.publicKey} to ${receiverAddress}, gasPrice ${parseInt(gasPrice, 16)}, gasLimit ${DEFAULT_GAS_LIMIT}, nonce ${nonce}`)
    const receipt = await web3.eth.sendSignedTransaction(signedTx)

    return { receipt, txParams }
}

// Query mainnet ethereum gas prices
const getProdGasInfo = async (redis, logger) => {
    const prodGasPriceKey = 'eth-gas-prod-price-info'
    let gasInfo = await redis.get(prodGasPriceKey)
    console.log(`Found gasInfo: ${gasInfo}`)
    if (!gasInfo) {
      logger.info(`Redis cache miss, querying remote`)
      let prodGasInfo = await axios({
        method: 'get',
        url: 'https://ethgasstation.info/api/ethgasAPI.json'
      })
      let { fast, fastest, safeLow, average } = prodGasInfo.data
      gasInfo = { fast, fastest, safeLow, average }
      // Convert returned values into gwei to be used during relay and cache
      gasInfo.fastGwei = (parseInt(gasInfo.fast) * Math.pow(10, 9))
      gasInfo.fastestGwei = (parseInt(gasInfo.fastest) * Math.pow(10, 9))
      gasInfo.averageGwei = (parseInt(gasInfo.average) * Math.pow(10, 9))
      gasInfo.fastGweiHex = ethWeb3.utils.numberToHex(gasInfo.fastGwei)
      gasInfo.fastestGweiHex = ethWeb3.utils.numberToHex(gasInfo.fastestGwei)
      gasInfo.averageGweiHex = ethWeb3.utils.numberToHex(gasInfo.averageGwei)
      gasInfo.cachedResponse = false
      redis.set(prodGasPriceKey, JSON.stringify(gasInfo), 'EX', 30)
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
    const minimumBalance = ethWeb3.utils.toWei(config.get('minimumBalance').toString(), 'ether')
    for (let ethWallet of ethRelayerWallets) {
      let ethWalletPublicKey = ethWallet.publicKey
      logger.info(`L1 Querying balance for ethRelayerPublicKey: ${ethWalletPublicKey}`)
      let balance = await ethWeb3.eth.getBalance(ethWalletPublicKey)
      logger.info(`L1 balance for ethRelayerPublicKey: ${balance}, minimumBalance: ${minimumBalance}`)
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