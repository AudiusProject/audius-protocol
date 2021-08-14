const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {
  /**
   * Update a user's replica set on the UserReplicaSetManager contract
   * Callable by user wallet, or any node within the user's replica set
   * @param {number} userId
   * @param {number} primary
   * @param {Array<number>} secondaries
   */
  async updateReplicaSet (userId, primary, secondaries) {
    let existingReplicaSetInfo = await this.getUserReplicaSet(userId)
    return this._updateReplicaSet(
      userId,
      primary,
      secondaries,
      existingReplicaSetInfo.primaryId,
      existingReplicaSetInfo.secondaryIds
    )
  }

  /**
   * Add a new content node to the L2 layer of the protocol
   * Requires signatures from 3 existing nodes on the UserReplicaSetManager contract
   * @param {number} cnodeId
   * @param {Array<string>} cnodeOwnerWallets - [0] = incoming delegateOwnerWallet, [1] = incoming ownerWallet
   * @param {Array<number>} proposerSpIds
   * @param {Array<string>} proposerNonces
   * @param {string} proposer1Sig
   * @param {string} proposer2Sig
   * @param {string} proposer3Sig
   */
  async addOrUpdateContentNode (
    cnodeId,
    cnodeOwnerWallets,
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
      cnodeOwnerWallets,
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

  /**
   * Generate the relevant data required to propose a new content node
   * Each incoming node requires 3 distinct signatures in order to be added
   * This function will be used by content nodes
   * @param {number} cnodeId
   * @param {string} cnodeDelegateWallet
   * @param {number} proposerSpId
   */
  async getProposeAddOrUpdateContentNodeRequestData (
    cnodeId,
    cnodeDelegateWallet,
    cnodeOwnerWallet,
    proposerSpId
  ) {
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const signatureData = signatureSchemas.generators.getProposeAddOrUpdateContentNodeRequestData(
      chainId,
      contractAddress,
      cnodeId,
      cnodeDelegateWallet,
      cnodeOwnerWallet,
      proposerSpId,
      nonce
    )
    let sig = await this.web3Manager.signTypedData(signatureData)
    return {
      nonce,
      signatureData,
      sig
    }
  }

  /**
   * Returns replica set for requested user at requested blocknumber
   * @param {number} userId
   * @returns {Object} replica set info with schema { primaryId: int, secondaryIds: int[] }
   */
  async getUserReplicaSet (userId) {
    const method = await this.getMethod('getUserReplicaSet', userId)
    const currentWallet = this.web3Manager.getWalletAddress()
    const resp = await method.call({ from: currentWallet })
    return {
      primaryId: parseInt(resp.primaryId),
      secondaryIds: resp.secondaryIds.map(x => parseInt(x))
    }
  }

  /**
   * Returns replica set for requested user at requested blocknumber
   * @notice will error if web3 cannot find data for requested blocknumber
   * @returns {Object} replica set info with schema { primaryId: int, secondaryIds: int[] }
   */
  async getUserReplicaSetAtBlockNumber (userId, blockNumber) {
    const method = await this.getMethod('getUserReplicaSet', userId)
    const currentWallet = this.web3Manager.getWalletAddress()
    const resp = await method.call({ from: currentWallet }, blockNumber)
    return {
      primaryId: parseInt(resp.primaryId),
      secondaryIds: resp.secondaryIds.map(x => parseInt(x))
    }
  }

  /**
   * Return the current ownerWallet and delegateOwnerWallet for a given spID
   * @param {number} userId
   */
  async getContentNodeWallets (spId) {
    const method = await this.getMethod('getContentNodeWallets', spId)
    let currentWallet = this.web3Manager.getWalletAddress()
    return method.call({ from: currentWallet })
  }

  /**
   * Return boolean indicating status of URSM seed operation
   * Prior to seed, no replica sets can be written
   */
  async getSeedComplete () {
    const method = await this.getMethod('getSeedComplete')
    let currentWallet = this.web3Manager.getWalletAddress()
    return method.call({ from: currentWallet })
  }

  /**
   * Submit update transaction to UserReplicaSetManager to modify a user's replica set
   * Can be sent by user's wallet, or any content node in the replica set
   * @param {number} userId
   * @param {number} primary
   * @param {Array<number>} secondaries
   * @param {number} oldPrimary
   * @param {Array<number>} oldSecondaries
   */
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
}

module.exports = UserReplicaSetManagerClient
