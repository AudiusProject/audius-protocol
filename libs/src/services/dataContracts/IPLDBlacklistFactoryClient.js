const signatureSchemas = require('../../../data-contracts/signatureSchemas')
const sigUtil = require('eth-sig-util')
const BufferSafe = require('safe-buffer').Buffer

class IPLDBlacklistFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.IPLDBlacklistFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  async addIPLDToBlacklist (multihashDigest, privateKey = null) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.addIPLDToBlacklistRequestData,
      multihashDigest,
      privateKey
    )
    const contractMethod = this.IPLDBlacklistFactory.methods.addIPLDToBlacklist(
      multihashDigest,
      nonce,
      sig
    )

    const receipt = await contractMethod.send({ from: this.web3Manager.getWalletAddress(), gas: 200000 })
    return receipt
  }

  /* ------- HELPERS ------- */

  /**
   * Gets a nonce and generates a signature for the given function. Private key is optional and
   * will use that private key to create the signature. Otherwise the web3Manager private key
   * will be used.
   * @param {Object} generatorFn signature scheme object function
   * @param {number} userId blockchain userId
   * @param {string} privateKey optional. if this is passed in, the signature will be from
   * this private key. the type is a 64 character hex string
   */
  async getUpdateNonceAndSig (generatorFn, multihashDigest, privateKey) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = generatorFn(chainId, this.contractAddress, multihashDigest, nonce)
    let sig
    if (privateKey) {
      sig = sigUtil.signTypedData(BufferSafe.from(privateKey, 'hex'), { data: signatureData })
    } else {
      sig = await this.web3Manager.signTypedData(signatureData)
    }
    return [nonce, sig]
  }
}

module.exports = IPLDBlacklistFactoryClient
