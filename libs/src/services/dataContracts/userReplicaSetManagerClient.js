const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')
const Web3Manager = require('../web3Manager/index')

class UserReplicaSetManagerClient extends ContractClient {

  async updateReplicaSet(userId, primary, secondaries) {
    let existingReplicaSetInfo = await this.getUserReplicaSet(userId)
    return await this._updateReplicaSet(
      userId,
      primary,
      secondaries,
      existingReplicaSetInfo.primary,
      existingReplicaSetInfo.secondaries
    )
  }

  async addOrUpdateContentNode(
    cnodeId,
    cnodeDelegateOwnerWallet,
    proposerSpIds,
    proposerNonces,
    proposer1Sig,
    proposer2Sig,
    proposer3Sig
  ) {
    const contractAddress = await this.getAddress()
    const method = await this.getMethod(
      'addOrUpdateContentNode',
      cnodeId,
      cnodeDelegateOwnerWallet,
      proposerSpIds,
      proposerNonces,
      proposer1Sig,
      proposer2Sig,
      proposer3Sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return tx
  }

  async getProposeAddOrUpdateContentNodeRequestData (
    cnodeId,
    cnodeDelegateWallet,
    proposerSpId,
    proposerWallet,
    ethWeb3
  ) {
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const signatureData = signatureSchemas.generators.getProposeAddOrUpdateContentNodeRequestData(
      chainId,
      contractAddress,
      cnodeId,
      cnodeDelegateWallet,
      proposerSpId,
      nonce
    )
    let sig = await Web3Manager.ethSignTypedData(ethWeb3, proposerWallet, signatureData)
    return {
      nonce,
      signatureData,
      sig
    }
  }

  // TODO: Comments throughout
  async _updateReplicaSet (userId, primary, secondaries, oldPrimary, oldSecondaries) {
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    let web3 = this.web3Manager.getWeb3()
    let secondariesHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameter('uint[]', secondaries))
    let oldSecondariesHash = web3.utils.soliditySha3(web3.eth.abi.encodeParameter('uint[]', oldSecondaries))
    let signatureData = signatureSchemas.generators.getUpdateReplicaSetRequestData(
      chainId,
      contractAddress,
      userId,
      primary,
      secondariesHash,
      oldPrimary,
      oldSecondariesHash,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod('updateReplicaSet',
      userId,
      primary,
      secondaries,
      oldPrimary,
      oldSecondaries,
      nonce,
      sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return tx
  }

  // TODO: AddOrUpdateContentNode Functionality

  async getUserReplicaSet (userId) {
    const method = await this.getMethod('getUserReplicaSet', userId)
    let currentWallet = this.web3Manager.getWalletAddressString()
    return method.call({ from: currentWallet })
  }

  async getContentNodeWallet (spId) {
    const method = await this.getMethod('getContentNodeWallet', spId)
    let currentWallet = this.web3Manager.getWalletAddressString()
    return method.call({ from: currentWallet })
  }
}

module.exports = UserReplicaSetManagerClient
