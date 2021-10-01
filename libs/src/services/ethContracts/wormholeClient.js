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

  async initialize (
    fromAcct,
    wormholeAddress,
    relayer
  ) {

    console.log({
      tokenAddr: this.audiusTokenClient.contractAddress,
      wormholeAddress
    })
    const method = this.WormholeContract.methods.initialize(
      this.audiusTokenClient.contractAddress,
      wormholeAddress
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

  async transferTokens (
    fromAcct,
    amount,
    chainId,
    solanaAccount,
    arbiterFee,
    deadline,
    signedDigest,
    relayer
  ) {
    const method = this.WormholeContract.methods.transferTokens(
      fromAcct,
      amount,
      chainId,
      solanaAccount,
      arbiterFee,
      deadline,
      signedDigest.v,
      signedDigest.r,
      signedDigest.s
    )
    console.log({ method })
    const tx = await this.ethWeb3Manager.relayTransaction(
      method,
      this.contractAddress,
      fromAcct,
      relayer,
      /* retries */ 0,
      250 * 1000
    )
    return { txReceipt: tx }
  }
}

module.exports = WormholeClient
