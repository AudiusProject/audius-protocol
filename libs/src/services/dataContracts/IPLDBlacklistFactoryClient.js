const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')
const sigUtil = require('eth-sig-util')
const BufferSafe = require('safe-buffer').Buffer

class IPLDBlacklistFactoryClient extends ContractClient {
  async addIPLDToBlacklist (multihashDigest, privateKey = null) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.addIPLDToBlacklistRequestData,
      multihashDigest,
      privateKey
    )
    const method = await this.getMethod('addIPLDToBlacklist',
      multihashDigest,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    // const receipt = await method.send({ from: this.web3Manager.getWalletAddress(), gas: 200000 })
    const receipt = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress,
      8000000 // how much u pay for each unit of gasssss
    )
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
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = generatorFn(chainId, contractAddress, multihashDigest, nonce)
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
