const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {
  async addTrackRepost (userId, trackId) {
    // generate new track repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getAddTrackRepostRequestData(
      chainId,
      contractAddress,
      userId,
      trackId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new trackRepost to chain
    const method = await this.getMethod('addTrackRepost',
      userId,
      trackId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }
}

module.exports = UserReplicaSetManagerClient
