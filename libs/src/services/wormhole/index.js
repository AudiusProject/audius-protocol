const bs58 = require('bs58')
const { toBuffer } = require('ethereumjs-util')
const { zeroPad } = require('ethers/lib/utils')
const { providers } = require('ethers/lib/index')
const wormholeSDK = require('@certusone/wormhole-sdk')

const SolanaUtils = require('../solanaWeb3Manager/utils')
const { Utils } = require('../../utils')
const { wAudioFromWeiAudio } = require('../solanaWeb3Manager/wAudio')
const { sign, getTransferTokensDigest } = require('../../utils/signatures')
/** Singleton state-manager for Audius Eth Contracts */

class Wormhole {
  /**
   * Wormhole constructor
   * @param {object} hedgehog
   * @param {object} ethWeb3Manager
   * @param {object} ethContracts
   * @param {object} identityService
   * @param {object} solanaWeb3Manager
   * @param {Array<string>} rpcHosts
   * @param {string} solBridgeAddress
   * @param {string} solTokenBridgeAddress
   * @param {string} ethBridgeAddress
   * @param {string} ethTokenBridgeAddress
   * @param {boolean} isServer
  */
  constructor (
    hedgehog,
    ethWeb3Manager,
    ethContracts,
    identityService,
    solanaWeb3Manager,
    rpcHosts,
    solBridgeAddress,
    solTokenBridgeAddress,
    ethBridgeAddress,
    ethTokenBridgeAddress,
    isServer
  ) {
    // Wormhole service dependecies
    this.hedgehog = hedgehog
    this.ethWeb3Manager = ethWeb3Manager
    this.ethContracts = ethContracts
    this.identityService = identityService
    this.solanaWeb3Manager = solanaWeb3Manager

    // Wormhole config
    this.rpcHosts = rpcHosts
    this.solBridgeAddress = solBridgeAddress
    this.solTokenBridgeAddress = solTokenBridgeAddress
    this.ethBridgeAddress = ethBridgeAddress
    this.ethTokenBridgeAddress = ethTokenBridgeAddress
    this.wormholeSDK = wormholeSDK
  }

  async getSignedVAAWithRetry (
    hosts,
    emitterChain,
    emitterAddress,
    sequence,
    extraGrpcOpts = {},
    retryTimeout = 5000,
    retryAttempts = 60
  ) {
    let currentWormholeRpcHost = -1
    const getNextRpcHost = () => ++currentWormholeRpcHost % hosts.length
    let result
    let attempts = 0
    while (!result) {
      attempts++
      await new Promise((resolve) => setTimeout(resolve, retryTimeout))
      try {
        result = await this.wormholeSDK.getSignedVAA(
          hosts[getNextRpcHost()],
          emitterChain,
          emitterAddress,
          sequence,
          extraGrpcOpts
        )
      } catch (e) {
        if (retryAttempts !== undefined && attempts > retryAttempts) {
          throw e
        }
      }
    }
    return result
  }

  /**
   * Sends `amount` tokens to `solanaAccount` by way of the wormhole
   * @param {string} ethTxReceipt The tx receipt
   * @param {function} [customSignTransaction] Optional custom sign transaction parameter
   * @param {Object?} options The grpc options passed to get signed VAA for different transport
   *
   * else will attempt to relay
   * @returns {Promise} Promise object of {
        transactionSignature: string,
        error: Error,
        phase: string,
        logs: Array<string>
      }
   */
  async attestAndCompleteTransferEthToSol (ethTxReceipt, customSignTransaction, options = {}) {
    const phases = {
      GET_RECEIPT: 'GET_RECEIPT',
      GET_SIGNED_VAA: 'GET_SIGNED_VAA',
      POST_VAA_SOLANA: 'POST_VAA_SOLANA',
      REDEEM_ON_SOLANA: 'REDEEM_ON_SOLANA'
    }
    let phase = phases.GET_RECEIPT
    const logs = [`Attest and complete transfer for eth to sol for reciept ${ethTxReceipt}`]
    try {
      const receipt = await this.ethWeb3Manager.web3.eth.getTransactionReceipt(ethTxReceipt)
      const sequence = this.wormholeSDK.parseSequenceFromLogEth(receipt, this.ethBridgeAddress)
      const emitterAddress = this.wormholeSDK.getEmitterAddressEth(this.ethTokenBridgeAddress)
      phase = phases.GET_SIGNED_VAA
      const { vaaBytes } = await this.getSignedVAAWithRetry(
        this.rpcHosts,
        this.wormholeSDK.CHAIN_ID_ETH,
        emitterAddress,
        sequence,
        options
      )

      const connection = this.solanaWeb3Manager.connection
      let signTransaction
      if (customSignTransaction) {
        signTransaction = customSignTransaction
      } else {
        signTransaction = async (transaction) => {
          const { blockhash } = await connection.getLatestBlockhash()
          // Must call serialize message to set the correct signatures on the transaction
          transaction.serializeMessage()
          const transactionData = {
            recentBlockhash: blockhash,
            instructions: transaction.instructions.map(SolanaUtils.prepareInstructionForRelay),
            signatures: transaction.signatures.map(sig => ({
              publicKey: sig.publicKey.toString(),
              signature: sig.signature
            }))
          }

          const { transactionSignature } = await this.identityService.solanaRelayRaw(transactionData)
          logs.push(`Relay sol tx for postVAA with signature ${transactionSignature}`)
          return {
            serialize: () => {}
          }
        }
        connection.sendRawTransaction = async () => ''
        connection.confirmTransaction = async () => ''
      }
      phase = phases.POST_VAA_SOLANA
      await this.wormholeSDK.postVaaSolana(
        connection,
        signTransaction,
        this.solBridgeAddress,
        this.solanaWeb3Manager.feePayerAddress.toString(), // payerAddress
        vaaBytes
      )

      // Finally, redeem on Solana
      phase = phases.REDEEM_ON_SOLANA
      const transaction = await this.wormholeSDK.redeemOnSolana(
        connection,
        this.solBridgeAddress,
        this.solTokenBridgeAddress,
        this.solanaWeb3Manager.feePayerAddress.toString(), // payerAddress,
        vaaBytes
      )

      let finalTxSignature
      // Must call serialize message to set the correct signatures on the transaction
      if (customSignTransaction) {
        const signedTransaction = await signTransaction(transaction)
        const txid = await connection.sendRawTransaction(signedTransaction.serialize())
        finalTxSignature = txid

        await connection.confirmTransaction(txid)
      } else {
        transaction.serializeMessage()

        const { blockhash } = await connection.getLatestBlockhash()
        const transactionData = {
          recentBlockhash: blockhash,
          instructions: transaction.instructions.map(SolanaUtils.prepareInstructionForRelay),
          signatures: transaction.signatures.map(sig => ({
            publicKey: sig.publicKey.toString(),
            signature: sig.signature
          }))
        }

        const { transactionSignature } = await this.identityService.solanaRelayRaw(transactionData)
        finalTxSignature = transactionSignature
      }
      logs.push(`Complete redeem on sol with signature ${finalTxSignature}`)
      return {
        transactionSignature: finalTxSignature,
        error: null,
        phase,
        logs
      }
    } catch (error) {
      return {
        error: error.message,
        phase,
        logs
      }
    }
  }

  /**
   * Sends `amount` tokens to `solanaAccount` by way of the wormhole
   * @param {BN} amount The amount of AUDIO to send in Wrapped Audio (8 decimals)
   * @param {string} ethTargetAddress The eth address to transfer AUDIO
   * @param {Object?} options The grpc options passed to get signed VAA for different transport
   */
  async sendTokensFromSolToEthViaWormhole (amount, ethTargetAddress, options = {}) {
    const phases = {
      GENERATE_SOL_ROOT_ACCT: 'GENERATE_SOL_ROOT_ACCT',
      TRANSFER_WAUDIO_TO_ROOT: 'TRANSFER_WAUDIO_TO_ROOT',
      TRANFER_FROM_SOL: 'TRANFER_FROM_SOL',
      GET_SIGNED_VAA: 'GET_SIGNED_VAA',
      GET_EMITTER_ADDR: 'GET_EMITTER_ADDR',
      REDEEM_ON_ETH: 'REDEEM_ON_ETH'
    }
    let phase = phases.GENERATE_SOL_ROOT_ACCT
    const logs = [`Transferring ${amount} WAUDIO to ${ethTargetAddress}`]
    try {
      if (typeof window === 'undefined' || window == null || window.ethereum == null) {
        throw new Error('Expected a browser/client context with Metamask')
      }
      const wAudioAmount = wAudioFromWeiAudio(amount)
      // Generate a solana keypair derived from the hedgehog private key
      // NOTE: The into to fromSeed is a 32 bytes Uint8Array
      const rootSolanaAccount = this.solanaWeb3Manager.solanaWeb3.Keypair.fromSeed(
        this.hedgehog.wallet.getPrivateKey()
      )

      const solanaAddress = rootSolanaAccount.publicKey.toString()
      logs.push(`Root Solana Account: ${solanaAddress}`)

      // Find the token account owned by the root solana account and get the token account's info
      const associatedTokenAccount = await this.solanaWeb3Manager.findAssociatedTokenAddress(solanaAddress)
      const tokenAccountInfo = await this.solanaWeb3Manager.getAssociatedTokenAccountInfo(associatedTokenAccount.toString())

      // If it's not a valid token account, create the token account
      if (!tokenAccountInfo) {
        logs.push(`Creating Associated Token Account: ${associatedTokenAccount.toString()}`)
        await this.solanaWeb3Manager.createAssociatedTokenAccount(solanaAddress)
      } else {
        logs.push(`Associated Token Account Exits: ${associatedTokenAccount.toString()}`)
      }

      phase = phases.TRANSFER_WAUDIO_TO_ROOT
      // Move wrapped audio from then user bank account to the user's token wallet
      await this.solanaWeb3Manager.transferWAudio(tokenAccountInfo.address.toString(), amount)
      logs.push(`Transferred waudio ${wAudioAmount.toString()} balance to associated token account`)
      phase = phases.TRANFER_FROM_SOL

      const connection = this.solanaWeb3Manager.connection

      // Submit transaction - results in a Wormhole message being published
      const tx = await this.wormholeSDK.transferFromSolana(
        connection, // solana web3 Connection
        this.solBridgeAddress, // bridge address
        this.solTokenBridgeAddress, // token bridge address
        this.solanaWeb3Manager.feePayerAddress, // payerAddress
        tokenAccountInfo.address.toString(), // fromAddress
        this.solanaWeb3Manager.mintAddress, // mintAddress
        wAudioAmount, // BigInt
        zeroPad(toBuffer(ethTargetAddress), 32), // Uint8Array of length 32 targetAddress
        this.wormholeSDK.CHAIN_ID_ETH, // ChainId targetChain
        zeroPad(toBuffer(this.ethContracts.AudiusTokenClient.contractAddress), 32), // Uint8Array of length 32 originAddress
        this.wormholeSDK.CHAIN_ID_ETH, //  ChainId originChain
        solanaAddress // from owner address
      )

      // Must call serialize message to set the correct signatures on the transaction
      tx.serializeMessage()
      tx.partialSign(rootSolanaAccount)

      const { blockhash } = await connection.getLatestBlockhash()
      const transactionData = {
        recentBlockhash: blockhash,
        instructions: tx.instructions.map(SolanaUtils.prepareInstructionForRelay),
        signatures: tx.signatures.map(sig => ({
          publicKey: sig.publicKey.toString(),
          signature: sig.signature
        }))
      }
      const { transactionSignature } = await this.identityService.solanaRelayRaw(transactionData)
      logs.push(`Transferred to wormhole with signature: ${transactionSignature}`)
      phase = phases.GET_EMITTER_ADDR

      // Get the sequence number and emitter address required to fetch the signedVAA of our message
      const info = await connection.getTransaction(transactionSignature)
      const sequence = this.wormholeSDK.parseSequenceFromLogSolana(info)
      const emitterAddress = await this.wormholeSDK.getEmitterAddressSolana(this.solTokenBridgeAddress)
      // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
      phase = phases.GET_SIGNED_VAA
      const { vaaBytes } = await this.getSignedVAAWithRetry(
        this.rpcHosts,
        this.wormholeSDK.CHAIN_ID_SOLANA,
        emitterAddress,
        sequence,
        options
      )

      // Redeem on Ethereum
      // NOTE: The signer should be the user's personal wallet
      phase = phases.REDEEM_ON_ETH
      const signer = (new providers.Web3Provider(window.ethereum)).getSigner()
      await this.wormholeSDK.redeemOnEth(this.ethTokenBridgeAddress, signer, vaaBytes)
      logs.push('Redeemed on eth')
      return { phase, logs, error: null }
    } catch (error) {
      return {
        error: error.message,
        phase,
        logs
      }
    }
  }

  /**
   * Locks assets owned by `fromAccount` into the Solana wormhole with a target
   * solanaAccount destination via the provided relayer wallet.
   * @param {string} fromAccount the account holding the ETH AUDIO to transfer
   * @param {BN} amount The amount of AUDIO to send in WEI (18 decimals)
   * @param {string} solanaAccount The solana token account
   */
  async _getTransferTokensToEthWormholeParams (fromAccount, amount, solanaAccount) {
    const web3 = this.ethWeb3Manager.getWeb3()
    const wormholeClientAddress = this.ethContracts.WormholeClient.contractAddress

    const chainId = await web3.eth.getChainId()

    const currentBlockNumber = await web3.eth.getBlockNumber()
    const currentBlock = await web3.eth.getBlock(currentBlockNumber)

    // 1 hour, sufficiently far in future
    const deadline = currentBlock.timestamp + (60 * 60 * 1)
    const solanaB58 = bs58.decode(solanaAccount).toString('hex')
    const recipient = toBuffer(`0x${solanaB58}`)
    const nonce = await this.ethContracts.WormholeClient.nonces(fromAccount)
    const arbiterFee = Utils.toBN('0')

    const digest = getTransferTokensDigest(
      web3,
      'AudiusWormholeClient',
      wormholeClientAddress,
      chainId,
      {
        from: fromAccount,
        amount,
        recipientChain: chainId,
        recipient,
        arbiterFee
      },
      nonce,
      deadline
    )
    const { privateKey } = this.hedgehog.getWallet()
    const signedDigest = sign(digest, privateKey)
    return {
      chainId,
      deadline,
      recipient,
      arbiterFee,
      signedDigest
    }
  }

  /**
   * Locks assets owned by `fromAccount` into the Solana wormhole with a target
   * solanaAccount destination via the provided relayer wallet.
   * @param {string} fromAccount the account holding the ETH AUDIO to transfer
   * @param {BN} amount The amount of AUDIO to send in WEI (18 decimals)
   * @param {string} solanaAccount The solana token account
   * @param {string} relayer The eth relayer to permission to aprrove and transfer
   */
  async transferTokensToEthWormhole (fromAccount, amount, solanaAccount, relayer) {
    const {
      chainId,
      deadline,
      recipient,
      arbiterFee,
      signedDigest
    } = await this._getTransferTokensToEthWormholeParams(fromAccount, amount, solanaAccount)
    const tx = await this.ethContracts.WormholeClient.transferTokens(
      fromAccount,
      amount,
      chainId,
      recipient,
      arbiterFee,
      deadline,
      signedDigest,
      relayer
    )
    return tx
  }

  async getTransferTokensToEthWormholeMethod (fromAccount, amount, solanaAccount, relayer) {
    const {
      chainId,
      deadline,
      recipient,
      arbiterFee,
      signedDigest
    } = await this._getTransferTokensToEthWormholeParams(fromAccount, amount, solanaAccount)
    const method = await this.ethContracts.WormholeClient.WormholeContract.methods.transferTokens(
      fromAccount,
      amount,
      chainId,
      recipient,
      arbiterFee,
      deadline,
      signedDigest.v,
      signedDigest.r,
      signedDigest.s
    )
    return method
  }
}

module.exports = Wormhole
