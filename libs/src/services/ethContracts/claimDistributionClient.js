const ContractClient = require('../contracts/ContractClient')
const DEFAULT_GAS_AMOUNT = 1000000

class ClaimDistributionClient extends ContractClient {

  // ===================== Contract Methods =====================

  // TODO: Figure out type figure out index
  async isClaimed(index) {
    const method = await this.getMethod(
      'isClaimed',
      index
    )
    const tx = await this.web3Manager.relayTransaction(
      method,
      this.contractRegistryKey,
      this.contractAddress,
      DEFAULT_GAS_AMOUNT
    )
    // Boolean if claimed
    return tx
  }

  // TODO: Figure out type figure out merkleProof
  async claim(index, account, amount, merkleProof) {
    const method = await this.getMethod(
      'claim',
      index,
      account,
      amount,
      merkleProof
    )
    const tx = await this.web3Manager.relayTransaction(
      method,
      this.contractRegistryKey,
      this.contractAddress,
      DEFAULT_GAS_AMOUNT
    )
    // TODO: Figure out type
    return tx
  }
}

module.exports = ClaimDistributionClient
