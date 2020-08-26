class AudiusTokenClient {
  constructor (ethWeb3Manager, contractABI, contractAddress) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.ethWeb3Manager.getWeb3()
    this.AudiusTokenContract = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- GETTERS ------- */

  async balanceOf (account) {
    const balance = await this.AudiusTokenContract.methods.balanceOf(account).call()
    return this.web3.utils.toBN(balance)
  }

  /* ------- SETTERS ------- */

  async transfer (recipient, amount) {
    const contractMethod = this.AudiusTokenContract.methods.transfer(recipient, amount)
    const tx = await this.ethWeb3Manager.sendTransaction(contractMethod)
    return { txReceipt: tx }
  }

  // Allow spender to withdraw from calling account up to value amount
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
  async approve (spender, value, privateKey = null) {
    const contractMethod = this.AudiusTokenContract.methods.approve(spender, value)
    let tx
    if (privateKey === null) {
      tx = await this.ethWeb3Manager.sendTransaction(contractMethod)
    } else {
      tx = await this.ethWeb3Manager.sendTransaction(
        contractMethod,
        1000000,
        this.contractAddress,
        privateKey)
    }
    return { txReceipt: tx }
  }
}

module.exports = AudiusTokenClient
