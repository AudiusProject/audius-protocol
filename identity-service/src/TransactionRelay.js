const Web3 = require('web3')
const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')
const { AudiusABIDecoder } = require('@audius/libs')

const models = require('./models')
const config = require('./config')
const { logger } = require('./logging')

const primaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
const secondaryWeb3 = new Web3(new Web3.providers.HttpProvider(config.get('secondaryWeb3Provider')))

const MIN_GAS_PRICE = config.get('minGasPrice')
const HIGH_GAS_PRICE = config.get('highGasPrice')
const GANACHE_GAS_PRICE = config.get('ganacheGasPrice')
const DEFAULT_GAS_LIMIT = config.get('defaultGasLimit')

class TransactionRelay {
  constructor () {
    if (!TransactionRelay.instance) {
      this.availableWallets = this.getAvailableWallets()
      this.usedWallets = []
    }

    TransactionRelay.instance = this
    return this
  }

  /** Attempt to send transaction to primary web3 provider, if that fails try secondary */
  async sendTransaction (req, resetNonce = false, txProps, reqBodySHA) {
    let resp = null
    try {
      resp = await this.sendTransactionInternal(req, primaryWeb3, txProps, reqBodySHA)
    } catch (e) {
      logger.error(`TransactionRelay - sendTransaction Error - ${e}. Retrying with secondary web3.`)
      resp = await this.sendTransactionInternal(req, secondaryWeb3, txProps, reqBodySHA)
    }
    return resp
  }

  /**
  * TODO(roneilr): this should check that in the registry, contractRegistryKey maps to
  *  contractAddress, rejecting the tx if not. Also needs to maintain a whitelist of
  *  contracts (eg. storage contracts, discovery service contract, should not be allowed
  *  to relay TXes from here but can today).
  */
  async sendTransactionInternal (req, web3, txProps, reqBodySHA) {
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

    // will be set later. necessary for code outside scope of try block
    let receipt
    let redisLogParams
    let wallet = this.selectAvailableWallet()

    while (!wallet) {
      await new Promise(resolve => setTimeout(resolve, 200))
      wallet = this.selectAvailableWallet()
    }

    try {
      logger.info('relayTx - selected wallet', wallet.publicKey)
      const privateKeyBuffer = Buffer.from(wallet.privateKey, 'hex')
      const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
      const address = walletAddress.getAddressString()
      if (address !== wallet.publicKey.toLowerCase()) {
        throw new Error('Invalid relayerPublicKey')
      }

      const gasPrice = await this.getGasPrice(req, web3)
      const nonce = await web3.eth.getTransactionCount(address)

      const txParams = {
        nonce: web3.utils.toHex(nonce),
        gasPrice: gasPrice,
        gasLimit: gasLimit ? web3.utils.numberToHex(gasLimit) : DEFAULT_GAS_LIMIT,
        to: contractAddress,
        data: encodedABI,
        value: '0x00'
      }

      const tx = new EthereumTx(txParams)
      tx.sign(privateKeyBuffer)

      const signedTx = '0x' + tx.serialize().toString('hex')

      redisLogParams = {
        date: Math.floor(Date.now() / 1000),
        reqBodySHA,
        txParams,
        senderAddress,
        nonce
      }
      await redis.zadd('relayTxAttempts', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
      logger.info(`TransactionRelay - sending a transaction for wallet ${wallet.publicKey} to ${senderAddress}, req ${reqBodySHA}, gasPrice ${parseInt(gasPrice, 16)}, gasLimit ${gasLimit}, nonce ${nonce}`)
      receipt = await web3.eth.sendSignedTransaction(signedTx)

      await redis.zadd('relayTxSuccesses', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
      await redis.hset('txHashToSenderAddress', receipt.transactionHash, senderAddress)
    } catch (e) {
      logger.error('TransactionRelay - Error in relay', e)
      await redis.zadd('relayTxFailures', Math.floor(Date.now() / 1000), JSON.stringify(redisLogParams))
      throw e
    }

    logger.info(`TransactionRelay - success, req ${reqBodySHA}`)

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

  // TODO - this only works locally, make it work on prod as well
  async fundRelayerIfEmpty () {
    const minimumBalance = primaryWeb3.utils.toWei(config.get('minimumBalance').toString(), 'ether')

    const wallets = this.getAvailableWallets()
    for (let wallet of wallets) {
      let balance = await primaryWeb3.eth.getBalance(wallet.publicKey)
      logger.info('Attempting to fund wallet', wallet.publicKey, parseInt(balance))

      if (parseInt(balance) < minimumBalance) {
        logger.info(`Relay account below minimum expected. Attempting to fund ${wallet.publicKey}`)
        const account = (await primaryWeb3.eth.getAccounts())[0]
        await primaryWeb3.eth.sendTransaction({ from: account, to: wallet.publicKey, value: minimumBalance })
        balance = await this.getRelayerFunds(wallet.publicKey)
        logger.info('Balance of relay account:', wallet.publicKey, primaryWeb3.utils.fromWei(balance, 'ether'), 'eth')
      }
    }
  }

  async getRelayerFunds (walletPublicKey) {
    return primaryWeb3.eth.getBalance(walletPublicKey)
  }

  async getGasPrice (req, web3) {
    let gasPrice = parseInt(await web3.eth.getGasPrice())
    if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
      logger.info('TransactionRelay - gas price was not defined or was greater than HIGH_GAS_PRICE', gasPrice)
      gasPrice = GANACHE_GAS_PRICE
    } else if (gasPrice === 0) {
      logger.info('TransactionRelay - gas price was zero', gasPrice)
      // If the gas is zero, the txn will likely never get mined.
      gasPrice = MIN_GAS_PRICE
    } else if (gasPrice < MIN_GAS_PRICE) {
      logger.info('TransactionRelay - gas price was less than MIN_GAS_PRICE', gasPrice)
      gasPrice = MIN_GAS_PRICE
    }
    gasPrice = '0x' + gasPrice.toString(16)

    return gasPrice
  }

  selectAvailableWallet () {
    // Generate a random wallet index of available wallets
    const wallets = this.getAvailableWallets()
    const randomWalletIndex = Math.floor(Math.random() * wallets.length)

    // Filter out the chosen wallet
    let chosenWallet
    const availableWallets = wallets.filter((wallet, i) => {
      if (i === randomWalletIndex) chosenWallet = wallet
      return i !== randomWalletIndex
    })

    // Update usedWallets and availableWallets
    this.usedWallets.push(chosenWallet)
    this.setAvailableWallets(availableWallets)

    // If all wallets have been used, reset the available wallets
    if (availableWallets.length === 0) {
      this.setAvailableWallets(this.getAvailableWallets())
      this.setUsedWallets([])
    }

    return chosenWallet
  }

  getAvailableWallets () {
    if (!this.availableWallets || this.availableWallets.length === 0) {
      return config.get('relayerWallets')
    }

    return this.availableWallets
  }

  setAvailableWallets (wallets) {
    this.availableWallets = wallets
  }

  setUsedWallets (wallets) {
    this.usedWallets = wallets
  }
}

module.exports = TransactionRelay
