const ContractClient = require('../contracts/ContractClient')

class AudiusTokenClient extends ContractClient {
  /* ------- GETTERS ------- */

  async balanceOf (account) {
    const method = await this.getMethod('balanceOf', account)
    const balance = await method.call()
    return parseInt(balance, 10)
  }

  /* ------- SETTERS ------- */

  async transfer (recipient, amount) {
    const contractMethod = await this.getMethod('transfer', recipient, amount)
    const tx = await this.web3Manager.sendTransaction(contractMethod)
    return { txReceipt: tx }
  }

  // Allow spender to withdraw from calling account up to value amount
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
  async approve (spender, value, privateKey = null) {
    const contractMethod = await this.getMethod('approve', spender, value)
    const contractAddress = await this.getAddress()
    let tx
    if (privateKey === null) {
      tx = await this.web3Manager.sendTransaction(contractMethod)
    } else {
      tx = await this.web3Manager.sendTransaction(
        contractMethod,
        1000000,
        contractAddress,
        privateKey)
    }
    return { txReceipt: tx }
  }
}

module.exports = AudiusTokenClient
