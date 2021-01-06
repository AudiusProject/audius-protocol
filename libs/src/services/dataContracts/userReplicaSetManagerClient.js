const ContractClient = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {

  async updateReplicaSet2(userId, primary, secondaries) {
    const contractAddress = await this.getAddress()
    console.log(`updateReplicaSet2 found contractAddress:${contractAddress}`)
    console.log(`UserReplicaSetManager client processing ${userId}`)
    console.log(`UserReplicaSetManager client ${userId} - primary=${primary}, secondaries=${secondaries}`)
    let existingReplicaSetInfo = await this.getUserReplicaSet(userId)
    console.log(`Found existing info: ${existingReplicaSetInfo}`)
    console.log(existingReplicaSetInfo)
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
    let currentWallet = this.web3Manager.ownerWallet
    if (typeof currentWallet === "object") {
      console.log(`Updating object to string format`)
      currentWallet = this.web3Manager.ownerWallet.getAddressString()
    }
    console.log(`Using ${currentWallet}`)
    let t = await method.call({ from: currentWallet })
    console.log(`getUserReplicaSet 3`)
    return t
  }

  async getContentNodeWallet (spId) {
    const method = await this.getMethod('getContentNodeWallet', spId)
    return method.call({ from: this.web3Manager.ownerWallet })
  }
}

module.exports = UserReplicaSetManagerClient
