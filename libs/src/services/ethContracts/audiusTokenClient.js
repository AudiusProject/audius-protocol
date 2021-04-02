class AudiusTokenClient {
  constructor (ethWeb3Manager, contractABI, contractAddress) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.ethWeb3Manager.getWeb3()
    this.AudiusTokenContract = new this.web3.eth.Contract(this.contractABI, this.contractAddress)

    this.bustCacheNonce = 0
  }

  /* ------- GETTERS ------- */

  async bustCache () {
    this.bustCacheNonce += 1
  }

  async balanceOf (account) {
    let args
    if (this.bustCacheNonce > 0) {
      args = { _audiusBustCache: this.bustCacheNonce }
    }
    const balance = await this.AudiusTokenContract.methods.balanceOf(account).call(args)
    return this.web3.utils.toBN(balance)
  }

  // Get the name of the contract
  async name () {
    const name = await this.AudiusTokenContract.methods.name().call()
    return name
  }

  // Get the name of the contract
  async nonces (wallet) {
    // Pass along a unique param so the nonce value is always not cached
    const nonce = await this.AudiusTokenContract.methods.nonces(wallet).call({
      _audiusBustCache: Date.now()
    })
    const number = this.web3.utils.toBN(nonce).toNumber()
    return number
  }

  /* ------- SETTERS ------- */

  async transfer (recipient, amount) {
    const contractMethod = this.AudiusTokenContract.methods.transfer(recipient, amount)
    const tx = await this.ethWeb3Manager.sendTransaction(contractMethod)
    return { txReceipt: tx }
  }

  async transferFrom (owner, recipient, amount) {
    const method = this.AudiusTokenContract.methods.transferFrom(owner, recipient, amount)
    const tx = await this.ethWeb3Manager.relayTransaction(
      method,
      this.contractAddress,
      owner,
      /* retries */ 0
    )
    return { txReceipt: tx }
  }

  // Permit meta transaction of balance transfer
  async permit (
    owner, // address
    spender, // address
    value, // uint
    deadline, // uint
    v, // uint8
    r, // bytes32
    s // bytes32
  ) {
    const contractMethod = this.AudiusTokenContract.methods.permit(
      owner,
      spender,
      value,
      deadline,
      v,
      r,
      s
    )
    const tx = await this.ethWeb3Manager.relayTransaction(
      contractMethod,
      this.contractAddress,
      owner,
      /* retries */ 0
    )
    return tx
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
        this.contractAddress,
        privateKey)
    }
    return { txReceipt: tx }
  }
}

module.exports = AudiusTokenClient
