const {
  getSignedVAA,
  getEmitterAddressEth,
  getEmitterAddressSolana,
  parseSequenceFromLogEth,
  parseSequenceFromLogSolana,
  redeemOnEth,
  redeemOnSolana
} = require('@certusone/wormhole-sdk')

/**
 * Wormhole is a wrapper around the `@certusone/wormhole` library to interface wormhole v2
 * It wraps methods to create and transfer balances between different chains
 */
class Wormhole {
  /**
   * @param {Object} wormholeConfig
   * @param {string} wormholeConfig.solChainId the chain id of solana
   * @param {string} wormholeConfig.rpcHost the wormhole RPC host
   * @param {string} wormholeConfig.ethBridgeAddress address of the sol wormhole bridge
   * @param {string} wormholeConfig. solBridgeAddress address of the sol wormhole bridge
   * @param {Object} ethWeb3Manager
   * @param {Object} solanaWeb3Manager
   * @param {Object} ethContracts
   */
  constructor (
    wormholeConfig,
    ethWeb3Manager,
    solanaWeb3Manager,
    ethContracts
  ) {
    this.wormholeConfig = wormholeConfig
    this.ethWeb3Manager = ethWeb3Manager
    this.solanaWeb3Manager = solanaWeb3Manager
    this.ethContracts = ethContracts
  }

  async init () {
    this.ethTokenBridgeAddress = this.ethContracts.WormholeClient.contractAddress
    this.ethBridgeAddress = this.wormholeConfig.ethBridgeAddress
    this.solTokenBridgeAddress = this.solanaWeb3Manager.claimableTokenProgramAddress
    this.waudioMintAddress = this.solanaWeb3Manager.mintAddress
    this.solBridgeAddress = this.wormholeConfig.solBridgeAddress

    this.ethChainId = await await this.ethWeb3Manager.web3.eth.getChainId()
    this.solChainId = this.wormholeConfig.solChainId
    this.wormholeRPCHost = this.wormholeConfig.wormholeRPCHost
  }

  /* ------- SETTERS ------- */

  /**
   * Transfers a eth wallet's ERC20 $AUDIO to wrapped AUDIO in solana.
   * @param {Object} param
   * @param {number} param.amount The amount in BN
   */
  async transferEthToSol ({
    amount
  }) {
    const ethWalletAddress = this.web3Manager.getWalletAddress()
    const solanaAccount = this.solanaWeb3Manager.getUserBank()

    // Submit transaction - results in a Wormhole message being published
    const receipt = await transferFromEth(
      this.ethContracts.WormholeClient.contractAddress, // tokenBridgeAddress: string
      ethWalletAddress, // signer: ethers.Signer
      this.ethContracts.audiusTokenClient.contractAddress, // tokenAddress: string
      amount, // amount: ethers.BigNumberish
      this.solChainId, // recipientChain: ChainId
      solanaAccount.toBuffer() // recipientAddress: Uint8Array
    )

    const sequence = parseSequenceFromLogEth(
      receipt, // receipt: ContractReceipt
      this.bridgeContractAddress // bridgeAddress: string
    )

    const emitterAddress = getEmitterAddressEth(this.ethContracts.WormholeClient.contractAddress)

    const { signedVAA } = await getSignedVAA(
      this.wormholeRPCHost, // host: string
      this.ethChainId, // emitterChain: ChainId
      emitterAddress, // emitterAddress: string
      sequence // sequence: string
    )

    // On Solana, we have to post the signedVAA ourselves
    await postVaaSolana(
      this.solanaWeb3Manager.connection, // connection: Connection
      this.signSolTransaction, // signTransaction: (transactione: Transaction) => any <======= IDK what to put here
      this.solBridgeAddress, // bridge_id: string
      this.solanaWeb3Manager.feePayerAddress, // payer: string,
      signedVAA // vaa: Buffer
    )

    // Redeem on Solana
    const transaction = await redeemOnSolana(
      this.solanaWeb3Manager.connection, // connection: Connection
      this.solBridgeAddress, // bridgeAddress: string
      this.solTokenBridgeAddress, // tokenBridgeAddress: string
      this.solanaWeb3Manager.feePayerAddress, // payerAddress: string
      signedVAA // signedVAA: Uint8Array
    )

    transaction.sign(solanaAccount)
    const txid = await this.solanaWeb3Manager.connection.sendRawTransaction(signed.serialize())
    await this.solanaWeb3Manager.connection.confirmTransaction(txid)
  }

  async signSolTransaction (transaction) {
    const solanaAccount = this.solanaWeb3Manager.getUserBank()
    transaction.sign(solanaAccount)
    return transaction
  }

  /**
   * Transfers wrapped $WAUDIO to ERC20 $AUDIO
   * @param {Object} param
   * @param {number} param.amount The amount in BN
   */
  async transferSolToEth (amount) {
    const ethWalletAddress = this.web3Manager.getWalletAddress()
    const solanaAccount = this.solanaWeb3Manager.getUserBank()

    // Submit transaction - results in a Wormhole message being published
    const transaction = await transferFromSolana(
      this.solanaWeb3Manager.connection, // connection: Connection
      this.solBridgeAddress, // bridgeAddress: string
      this.solTokenBridgeAddress, // tokenBridgeAddress: string
      this.feePayerAddress, // payerAddress: string
      solanaAccount.toString(), // fromAddress: string
      this.waudioMintAddress, // mintAddress: string
      amount, // amount: BigInt
      targetAddress, // targetAddress: Uint8Array
      this.ethChainId, // targetChain: ChainId
      originAddress, // originAddress?: Uint8Array
      this.ethChainId // originChain?: ChainId
    )

    transaction.sign(solanaAccount)
    const txid = await this.solanaWeb3Manager.connection.sendRawTransaction(transaction.serialize())
    await this.solanaWeb3Manager.connection.confirmTransaction(txid)

    // Get the sequence number and emitter address required to fetch the signedVAA of our message
    const info = await this.solanaWeb3Manager.connection.getTransaction(txid)
    const sequence = parseSequenceFromLogSolana(info)
    const emitterAddress = await getEmitterAddressSolana(this.solTokenBridgeAddress)

    // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    const { signedVAA } = await getSignedVAA(
      this.wormholeRPCHost, // host: string
      this.solChainId, // emitterChain: ChainId
      emitterAddress, // emitterAddress: string
      sequence // sequence: string
    )

    // Redeem on Ethereum
    await redeemOnEth(
      this.ethTokenBridgeAddress, // tokenBridgeAddress: string
      ethWalletAddress, // signer: ethers.Signer
      signedVAA // signedVAA: Uint8Array
    )
  }
  
}

module.exports = Wormhole
