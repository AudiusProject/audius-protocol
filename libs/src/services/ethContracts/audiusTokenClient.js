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
    return parseInt(balance, 10)
  }

  /* ------- SETTERS ------- */

  async transfer (recipient, amount) {
    const contractMethod = this.AudiusTokenContract.methods.transfer(recipient, amount)
    const tx = await this.ethWeb3Manager.sendTransaction(contractMethod)
    return { txReceipt: tx }
  }
}

module.exports = AudiusTokenClient
