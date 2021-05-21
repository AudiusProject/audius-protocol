class WormholeClient {
  constructor (ethWeb3Manager, contractABI, contractAddress, audiusTokenClient) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.ethWeb3Manager.getWeb3()
    this.audiusTokenClient = audiusTokenClient
    this.WormholeContract = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- SETTERS ------- */

  async lockAssets (owner, amount, solanaAccountHex, relayer) {
    const ethTokenContractAddress = this.audiusTokenClient.contractAddress
    const chainId = await this.ethWeb3Manager.web3.eth.getChainId()
    const nonce = 133
    const refundDust = false
    console.log(this.WormholeContract)
    const method = this.WormholeContract.methods.lockAssets(
      ethTokenContractAddress,
      amount,
      solanaAccountHex,
      chainId,
      nonce,
      refundDust
    )

    console.log({ method })

    const tx = await this.ethWeb3Manager.relayTransaction(
      method,
      this.contractAddress,
      owner,
      relayer,
      /* retries */ 0
    )
    return { txReceipt: tx }
  }
}

module.exports = WormholeClient
