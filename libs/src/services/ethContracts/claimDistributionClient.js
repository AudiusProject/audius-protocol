const ContractClient = require('../contracts/ContractClient')
const DEFAULT_GAS_AMOUNT = 1000000

class ClaimDistributionClient extends ContractClient {

  // ===================== Contract Methods =====================
  /**
   * Calls the contract method to check if the claim index has been claimed
   * @param {number} index
   * @returns {boolean} hasClaimed
   */
  async isClaimed(index) {
    const method = await this.getMethod(
      'isClaimed',
      index
    )
    const contractAddress = await this.getAddress()
    const hasClaimed = await this.web3Manager.relayTransaction(
      method,
      this.contractRegistryKey,
      contractAddress,
      DEFAULT_GAS_AMOUNT
    )
    // TODO: Ensure this is the boolean contract return val and not wrapped
    return hasClaimed
  }

  async claim(index, account, amount, merkleProof) {
    const method = await this.getMethod(
      'claim',
      index,
      account,
      amount,
      merkleProof
    )
    const contractAddress = await this.getAddress()
    const tx = await this.web3Manager.relayTransaction(
      method,
      this.contractRegistryKey,
      contractAddress,
      DEFAULT_GAS_AMOUNT
    )
    // TODO: Figure out type
    return tx
  }
}

module.exports = ClaimDistributionClient
