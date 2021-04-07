const Web3 = require('../../web3')
const MultiProvider = require('../../utils/multiProvider')
const EthereumTx = require('ethereumjs-tx').Transaction
const { estimateGas } = require('../../utils/estimateGas')
const retry = require('async-retry')
const MIN_GAS_PRICE = Math.pow(10, 9) // 1 GWei, POA default gas price
const HIGH_GAS_PRICE = 5 * MIN_GAS_PRICE // 5 GWei
const GANACHE_GAS_PRICE = 39062500000 // ganache gas price is extremely high, so we hardcode a lower value (0x09184e72a0 from docs here)

/** Singleton state-manager for Audius Eth Contracts */
class EthWeb3Manager {
  constructor (web3Config, identityService) {
    if (!web3Config) throw new Error('web3Config object not passed in')
    if (!web3Config.providers) throw new Error('missing web3Config property: providers')
    if (!web3Config.ownerWallet) throw new Error('missing web3Config property: ownerWallet')

    // MultiProvider implements a web3 provider with fallback.
    const provider = new MultiProvider(web3Config.providers)

    this.web3Config = web3Config
    this.identityService = identityService
    this.web3 = new Web3(provider)
    this.ownerWallet = web3Config.ownerWallet
  }

  getWeb3 () { return this.web3 }

  getWalletAddress () { return this.ownerWallet.toLowerCase() }

  async sendTransaction (
    contractMethod,
    contractAddress = null,
    privateKey = null,
    txRetries = 5,
    txGasLimit = null
  ) {
    const gasLimit = txGasLimit || await estimateGas({
      method: contractMethod,
      from: this.ownerWallet
    })
    if (contractAddress && privateKey) {
      let gasPrice = parseInt(await this.web3.eth.getGasPrice())
      if (isNaN(gasPrice) || gasPrice > HIGH_GAS_PRICE) {
        gasPrice = GANACHE_GAS_PRICE
      } else if (gasPrice === 0) {
        // If the gas is zero, the txn will likely never get mined.
        gasPrice = MIN_GAS_PRICE
      }
      gasPrice = '0x' + gasPrice.toString(16)

      let privateKeyBuffer = Buffer.from(privateKey, 'hex')
      let walletAddress = this.getWalletAddress()
      const txCount = await this.web3.eth.getTransactionCount(walletAddress)
      const encodedABI = contractMethod.encodeABI()
      const txParams = {
        nonce: this.web3.utils.toHex(txCount),
        gasPrice: gasPrice,
        gasLimit,
        data: encodedABI,
        to: contractAddress,
        value: '0x00'
      }
      const tx = new EthereumTx(txParams)
      tx.sign(privateKeyBuffer)
      const signedTx = '0x' + tx.serialize().toString('hex')

      // Send the tx with retries
      const response = await retry(async () => {
        return this.web3.eth.sendSignedTransaction(signedTx)
      }, {
        // Retry function 5x by default
        // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
        minTimeout: 500,
        maxTimeout: 4000,
        factor: 3,
        retries: txRetries,
        onRetry: (err, i) => {
          if (err) {
            console.log(`Retry error : ${err}`)
          }
        }
      })

      return response
    }

    let gasPrice = parseInt(await this.web3.eth.getGasPrice())
    return contractMethod.send({ from: this.ownerWallet, gas: gasLimit, gasPrice: gasPrice })
  }

  async relayTransaction (
    contractMethod,
    contractAddress,
    ownerWallet,
    txRetries = 5,
    txGasLimit = null
  ) {
    const encodedABI = contractMethod.encodeABI()
    const gasLimit = txGasLimit || await estimateGas({ method: contractMethod })
    const response = await retry(async bail => {
      try {
        const attempt = await this.identityService.ethRelay(
          contractAddress,
          ownerWallet,
          encodedABI,
          gasLimit
        )
        return attempt
      } catch (e) {
        if (e.response && e.response.status && e.response.status === 429) {
          // Don't retry in the case we are getting rate limited
          bail(new Error('Please wait before trying again'))
          return
        }
        // Trigger a retry
        throw e
      }
    }, {
      // Retry function 5x by default
      // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
      minTimeout: 500,
      maxTimeout: 4000,
      factor: 3,
      retries: txRetries,
      onRetry: (err, i) => {
        if (err) {
          console.log(`Retry error : ${err}`)
        }
      }
    })

    return response['receipt']
  }
}

module.exports = EthWeb3Manager
