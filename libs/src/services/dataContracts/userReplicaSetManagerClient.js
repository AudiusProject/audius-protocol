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

    // add new trackRepost to chain
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
}

module.exports = UserReplicaSetManagerClient
