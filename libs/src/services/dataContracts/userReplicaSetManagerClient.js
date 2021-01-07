const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {

  async updateReplicaSet2(userId, primary, secondaries) {
    let existingReplicaSetInfo = await this.getUserReplicaSet(userId)
    const existingPrimary = existingReplicaSetInfo.primary
    const existingSecondaries = existingReplicaSetInfo.secondaries
    console.log('Found everything!')
    console.log(existingPrimary)
    console.log(existingSecondaries)
    await this.updateReplicaSet(
      userId,
      primary,
      secondaries,
      existingPrimary,
      existingSecondaries
    )
  }

  // TODO: Comments throughout
  async updateReplicaSet (userId, primary, secondaries, oldPrimary, oldSecondaries) {
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    console.log(`updateReplicaSet: ${contractAddress}, ${nonce}, ${chainId}`)
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
    return this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  // TODO: AddOrUpdateContentNode Functionality

  async getUserReplicaSet (userId) {
    console.log('-----')
    console.log(`getUserReplicaSet 1`)
    const method = await this.getMethod('getUserReplicaSet', userId)
    console.log(`getUserReplicaSet 2, wallet=${this.web3Manager.ownerWallet}`)
    console.log(this.web3Manager.ownerWallet)
    console.log(typeof this.web3Manager.ownerWallet)

    let currentWallet = this.web3Manager.getWalletAddressString()

    console.log(`Using ${currentWallet}`)
    return method.call({ from: currentWallet })
  }

  async getContentNodeWallet (spId) {
    const method = await this.getMethod('getContentNodeWallet', spId)
    return method.call({ from: this.web3Manager.ownerWallet })
  }
}

module.exports = UserReplicaSetManagerClient
