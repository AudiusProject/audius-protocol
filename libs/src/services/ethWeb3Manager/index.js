const Web3 = require('../../web3')
const EthereumTx = require('ethereumjs-tx')
const DEFAULT_GAS_AMOUNT = 200000
const MIN_GAS_PRICE = Math.pow(10, 9) // 1 GWei, POA default gas price
const HIGH_GAS_PRICE = 5 * MIN_GAS_PRICE // 5 GWei
const GANACHE_GAS_PRICE = 39062500000 // ganache gas price is extremely high, so we hardcode a lower value (0x09184e72a0 from docs here)

/** Singleton state-manager for Audius Eth Contracts */
class EthWeb3Manager {
  constructor (web3Config) {
    if (!web3Config) throw new Error('web3Config object not passed in')
    if (!web3Config.url) throw new Error('missing web3Config property: url')
    if (!web3Config.ownerWallet) throw new Error('missing web3Config property: ownerWallet')

    this.web3Config = web3Config
    this.web3 = new Web3(web3Config.url)
    this.ownerWallet = web3Config.ownerWallet
  }

  getWeb3 () { return this.web3 }

  getWalletAddress () { return this.ownerWallet.toLowerCase() }

  async sendTransaction (
    contractMethod,
    gasAmount = DEFAULT_GAS_AMOUNT,
    contractAddress = null,
    privateKey = null) {
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
      return this.web3.eth.sendSignedTransaction(signedTx)
    }

    let gasPrice = parseInt(await this.web3.eth.getGasPrice())
    return contractMethod.send({ from: this.ownerWallet, gas: gasAmount, gasPrice: gasPrice })
  }
}

module.exports = EthWeb3Manager
