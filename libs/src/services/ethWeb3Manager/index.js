const Web3 = require('../../web3')
const EthereumTx = require('ethereumjs-tx')
const retry = require('async-retry')
const { sample } = require('lodash')
const DEFAULT_GAS_AMOUNT = 200000
const MIN_GAS_PRICE = Math.pow(10, 9) // 1 GWei, POA default gas price
const HIGH_GAS_PRICE = 5 * MIN_GAS_PRICE // 5 GWei
const GANACHE_GAS_PRICE = 39062500000 // ganache gas price is extremely high, so we hardcode a lower value (0x09184e72a0 from docs here)

/** Singleton state-manager for Audius Eth Contracts */
class EthWeb3Manager {
  constructor (web3Config) {
    if (!web3Config) throw new Error('web3Config object not passed in')
    if (!web3Config.providers) throw new Error('missing web3Config property: providers')
    if (!web3Config.ownerWallet) throw new Error('missing web3Config property: ownerWallet')

    // Pick a provider at random to spread the load
    const provider = sample(web3Config.providers)

    this.web3Config = web3Config
    this.web3 = new Web3(provider)
    this.ownerWallet = web3Config.ownerWallet
  }

  getWeb3 () { return this.web3 }

  getWalletAddress () { return this.ownerWallet.toLowerCase() }

  async sendTransaction (
    contractMethod,
    gasAmount = DEFAULT_GAS_AMOUNT,
    contractAddress = null,
    privateKey = null,
    txRetries = 5
  ) {
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
        gasLimit: '0xf7100',
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
    return contractMethod.send({ from: this.ownerWallet, gas: gasAmount, gasPrice: gasPrice })
  }

  async relayTransaction (
    contractMethod,
    contractRegistryKey,
    contractAddress,
    txGasLimit = DEFAULT_GAS_AMOUNT,
    txRetries = 5
  ) {
    const encodedABI = contractMethod.encodeABI()

    const response = await retry(async () => {
      return this.identityService.ethRelay(
        contractRegistryKey,
        contractAddress,
        this.ownerWallet.getAddressString(),
        encodedABI,
        txGasLimit
      )
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

    const receipt = response['receipt']

    // interestingly, using contractMethod.send from Metamask's web3 (eg. like in the if
    // above) parses the event log into an 'events' key on the transaction receipt and
    // blows away the 'logs' key. However, using sendRawTransaction as our
    // relayer does, returns only the logs. Here, we replicate the part of the 'events'
    // key that our code consumes, but we may want to change our functions to consume
    // this data in a different way in future (this parsing is messy).
    // More on Metamask's / Web3.js' behavior here:
    // https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
    if (receipt.logs) {
      const events = {}
      const decoded = this.AudiusABIDecoder.decodeLogs(contractRegistryKey, receipt.logs)
      decoded.forEach((evt) => {
        const returnValues = {}
        evt.events.forEach((arg) => {
          returnValues[arg['name']] = arg['value']
        })
        events[evt['name']] = { returnValues }
      })
      receipt['events'] = events
    }
    return response['receipt']
  }


}

module.exports = EthWeb3Manager
