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

  /**
   * Transfers in eth from the user's wallet to the wormhole contract and
   * specifies a solana wallet to realized the tokens in SOL
   *
   * @param {string} fromAcct
   * @param {BN} amount
   * @param {number} chainId
   * @param {*} solanaAccount
   * @param {*} arbiterFee
   * @param {*} deadline
   * @param {string} signedDigest
   * @param {string} relayer
   * @returns {
   *   txHash: string,
   *   txParams: {
   *      data: string
   *      gasLimit: string
   *      gasPrice: number
   *      nonce: string
   *      to: string
   *      value: string
   *   }
   * }
   */
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
    const tx = await this.ethWeb3Manager.relayTransaction(
      method,
      this.contractAddress,
      fromAcct,
      relayer,
      /* retries */ 0,
      null
    )
    return tx
  }
}

module.exports = WormholeClient
