const ContractClient = require('../contracts/ContractClient')
// const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserReplicaSetManagerClient extends ContractClient {
    // TODO: Write functions
    async getUserReplicaSet (userId) {
        const method = await this.getMethod('getUserReplicaSet', userId)
        return method.call()
    }
    async getContentNodeWallet (spId) {
        const method = await this.getMethod('getContentNodeWallet', spId)
        return method.call({ from: this.web3Manager.ownerWallet })
    }
}

module.exports = UserReplicaSetManagerClient