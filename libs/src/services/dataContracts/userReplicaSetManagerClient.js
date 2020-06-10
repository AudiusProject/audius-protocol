const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {
  async addOrUpdateCreatorNode (newCnodeId, newCnodeDelegateOwnerWallet, proposerSpId) {
    const contractAddress = await this.getAddress()
    /*
    // TODO: Add signature with EIP integration
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const signatureData = signatureSchemas.generators.getAddTrackRepostRequestData(
      chainId,
      contractAddress,
      userId,
      trackId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    */

    const method = await this.getMethod('addOrUpdateCreatorNode',
      newCnodeId,
      newCnodeDelegateOwnerWallet,
      proposerSpId
    )
    return this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async updateReplicaSet (userId, primary, secondaries, oldPrimary, oldSecondaries) {
    const contractAddress = await this.getAddress()
    const method = await this.getMethod('updateReplicaSet',
      userId,
      primary,
      secondaries,
      oldPrimary,
      oldSecondaries
    )
    return this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async getArtistReplicaSet (userId) {
    const method = await this.getMethod('getArtistReplicaSet', userId)
    return method.call()
  }

  async getCreatorNodeWallet (spId) {
    const method = await this.getMethod('getCreatorNodeWallet', spId)
    return method.call()
  }
}

module.exports = UserReplicaSetManagerClient
