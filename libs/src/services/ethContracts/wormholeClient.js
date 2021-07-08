class WormholeClient {
  constructor (ethWeb3Manager, contractABI, contractAddress, audiusTokenClient) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.ethWeb3Manager.getWeb3()
    this.audiusTokenClient = audiusTokenClient
    this.WormholeContract = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  // Get the name of the contract
  async nonces (wallet) {
    // Pass along a unique param so the nonce value is always not cached
    const nonce = await this.WormholeContract.methods.nonces(wallet).call({
      _audiusBustCache: Date.now()
    })
    const number = this.web3.utils.toBN(nonce).toNumber()
    return number
  }

  /* ------- SETTERS ------- */

  async lockAssets (
    fromAcct,
    amount,
    solanaAccount,
    chainId,
    refundDust,
    deadline,
    signedDigest,
    relayer
  ) {
    const method = this.WormholeContract.methods.lockAssets(
      fromAcct,
      amount,
      solanaAccount,
      chainId,
      refundDust,
      deadline,
      signedDigest.v,
      signedDigest.r,
      signedDigest.s
    )

    const tx = await this.ethWeb3Manager.relayTransaction(
      method,
      this.contractAddress,
      fromAcct,
      relayer,
      /* retries */ 0
    )
    return { txReceipt: tx }
  }
}

module.exports = WormholeClient
