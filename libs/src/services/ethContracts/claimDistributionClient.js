const ContractClient = require('../contracts/ContractClient')
const DEFAULT_GAS_AMOUNT = 1000000

class ClaimDistributionClient extends ContractClient {
  // ===================== Contract Methods =====================
  /**
   * Calls the contract method to check if the claim index has been claimed
   * @param {number} index
   * @returns {boolean} isClaimed
   */
  async isClaimed (index) {
    const method = await this.getMethod(
      'isClaimed',
      index
    )
    const isClaimed = await method.call()
    return isClaimed
  }

  /**
   * Proxies the calls the contract method to make a claim
   * @param {number} index
   * @param {string} account
   * @param {string} amount
   * @param {Array<string>} merkleProof
   * @returns {Object} transaction
   */
  async claim (index, account, amount, merkleProof) {
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
      contractAddress,
      account
    )
    return tx
  }
}

module.exports = ClaimDistributionClient
