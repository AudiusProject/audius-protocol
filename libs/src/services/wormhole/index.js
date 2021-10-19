const BN = require('bn.js')
const bs58 = require('bs58')
const { toBuffer } = require('ethereumjs-util')
const { zeroPad } = require('ethers/lib/utils')
const { providers } = require('ethers/lib/index')

const SolanaUtils = require('../solanaWeb3Manager/utils')
const Utils = require('../../utils')
const { wAudioFromWeiAudio } = require('../solanaWeb3Manager/wAudio')
const { sign, getTransferTokensDigest } = require('../../utils/signatures')
const {
  getSignedVAA,
  getEmitterAddressEth,
  parseSequenceFromLogEth,
  redeemOnSolana,
  postVaaSolana,
  parseSequenceFromLogSolana,
  getEmitterAddressSolana,
  transferFromSolana,
  redeemOnEth,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ETH
} = require('@certusone/wormhole-sdk')

/** Singleton state-manager for Audius Eth Contracts */
class Wormhole {
  /**
   * Wormhole constructor
   * @param {object} hedgehog
   * @param {object} ethWeb3Manager
   * @param {object} ethContracts
   * @param {object} identityService
   * @param {object} solanaWeb3Manager
   * @param {string} rpcHost
   * @param {string} solBridgeAddress
   * @param {string} solTokenBridgeAddress
   * @param {string} ethBridgeAddress
   * @param {string} ethTokenBridgeAddress
  */
   constructor (
    hedgehog,
    ethWeb3Manager,
    ethContracts,
    identityService,
    solanaWeb3Manager,
    rpcHost,
    solBridgeAddress,
    solTokenBridgeAddress,
    ethBridgeAddress,
    ethTokenBridgeAddress
  ) {

    // Wormhole service dependecies
    this.hedgehog = hedgehog
    this.ethWeb3Manager = ethWeb3Manager
    this.ethContracts = ethContracts
    this.identityService = identityService
    this.solanaWeb3Manager = solanaWeb3Manager

    // Wormhole config
    this.rpcHost = rpcHost
    this.solBridgeAddress = solBridgeAddress
    this.solTokenBridgeAddress = solTokenBridgeAddress
    this.ethBridgeAddress = ethBridgeAddress
    this.ethTokenBridgeAddress = ethTokenBridgeAddress

  }

  /**
   * Sends `amount` tokens to `solanaAccount` by way of the wormhole
   * @param {string} ethTxReceipt The tx receipt
   */
  async attestAndCompleteTransferEthToSol (ethTxReceipt) {
    const phases = {
      GET_RECEIPT: 'GET_RECEIPT',
      GET_SIGNED_VAA: 'GET_SIGNED_VAA',
      POST_VAA_SOLANA: 'POST_VAA_SOLANA',
      REDEEM_ON_SOLANA: 'REDEEM_ON_SOLANA'
    }
    let phase = phases.GET_RECEIPT
    let logs = [`Attest and complete transfer for eth to sol for reciept ${ethTxReceipt}`]
    try {
      const receipt = await this.ethWeb3Manager.web3.eth.getTransactionReceipt(ethTxReceipt)
      const sequence = parseSequenceFromLogEth(receipt, this.ethBridgeAddress);
      const emitterAddress = getEmitterAddressEth(this.ethTokenBridgeAddress);
      phase = phases.GET_SIGNED_VAA
      let { vaaBytes } = await getSignedVAA(
        this.rpcHost,
        CHAIN_ID_ETH,
        emitterAddress,
        sequence
      )
      const signTransaction = async (transaction) => {
        const { blockhash } = await connection.getRecentBlockhash()
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
          'serialize': () => {}
        }
      } 
      const connection = this.solanaWeb3Manager.connection
      connection.sendRawTransaction = async () => ''
      connection.confirmTransaction = async () => ''
      phase = phases.POST_VAA_SOLANA
      await postVaaSolana(
        connection,
        signTransaction,
        this.solBridgeAddress,
        this.solanaWeb3Manager.feePayerAddress, // payerAddress
        vaaBytes
      )
  
      // Finally, redeem on Solana
      phase = phases.REDEEM_ON_SOLANA
      const transaction = await redeemOnSolana(
        connection,
        this.solBridgeAddress,
        this.solTokenBridgeAddress,
        this.solanaWeb3Manager.feePayerAddress, // payerAddress,
        vaaBytes
      )
  
      // Must call serialize message to set the correct signatures on the transaction
      transaction.serializeMessage()
  
      const { blockhash } = await connection.getRecentBlockhash()
      const transactionData = {
        recentBlockhash: blockhash,
        instructions: transaction.instructions.map(SolanaUtils.prepareInstructionForRelay),
        signatures: transaction.signatures.map(sig => ({
          publicKey: sig.publicKey.toString(),
          signature: sig.signature
        }))
      }
  
      const { transactionSignature } = await this.identityService.solanaRelayRaw(transactionData)
      logs.push(`Complete redeem on sol with signature ${transactionSignature}`)
      return {
        transactionSignature,
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
   */
  async sendTokensFromSolToEthViaWormhole (amount, ethTargetAddress) {
    const phases = {
      GENERATE_SOL_ROOT_ACCT: 'GENERATE_SOL_ROOT_ACCT',
      TRANSFER_WAUDIO_TO_ROOT: 'TRANSFER_WAUDIO_TO_ROOT',
      TRANFER_FROM_SOL: 'TRANFER_FROM_SOL',
      GET_SIGNED_VAA: 'GET_SIGNED_VAA',
      GET_EMITTER_ADDR: 'GET_EMITTER_ADDR',
      REDEEM_ON_ETH: 'REDEEM_ON_ETH'
    }
    let phase = phases.GENERATE_SOL_ROOT_ACCT
    let logs = [`Transferring ${amount} WAUDIO to ${ethTargetAddress}`]
    try {
      const wAudioAmount = wAudioFromWeiAudio(amount)
      // Generate a solana keypair derived from the hedgehog private key
      // NOTE: The into to fromSeed is a 32 bytes Uint8Array
      let rootSolanaAccount = this.solanaWeb3Manager.solanaWeb3.Keypair.fromSeed(
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
      const tx = await transferFromSolana(
        connection, // solana web3 Connection
        this.solBridgeAddress, // bridge address
        this.solTokenBridgeAddress, // token bridge address
        this.solanaWeb3Manager.feePayerAddress, // payerAddress
        tokenAccountInfo.address.toString(), // fromAddress
        this.solanaWeb3Manager.mintAddress, // mintAddress
        wAudioAmount, // BigInt
        zeroPad(toBuffer(ethTargetAddress), 32), // Uint8Array of length 32 targetAddress 
        CHAIN_ID_ETH, // ChainId targetChain
        zeroPad(toBuffer(this.ethContracts.AudiusTokenClient.contractAddress), 32), // Uint8Array of length 32 originAddress
        CHAIN_ID_ETH, //  ChainId originChain
        solanaAddress // from owner address
      )

      // Must call serialize message to set the correct signatures on the transaction
      tx.serializeMessage()
      tx.partialSign(rootSolanaAccount)

      const { blockhash } = await connection.getRecentBlockhash()
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
      const info = await connection.getTransaction(transactionSignature);
      const sequence = parseSequenceFromLogSolana(info);
      const emitterAddress = await getEmitterAddressSolana(this.solTokenBridgeAddress);

      // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
      phase = phases.GET_SIGNED_VAA
      const { vaaBytes } = await getSignedVAA(
        this.rpcHost,
        CHAIN_ID_SOLANA,
        emitterAddress,
        sequence
      );

      // Redeem on Ethereum
      // NOTE: The signer should be the user's personal wallet
      phase = phases.REDEEM_ON_ETH
      const signer = (new providers.Web3Provider(window.ethereum)).getSigner()
      await redeemOnEth(this.ethTokenBridgeAddress, signer, vaaBytes)
      logs.push(`Redeemed on eth`)
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
   * @param {string} relayer The eth relayer to permission to aprrove and transfer
   */
  async transferTokensToEthWormhole (fromAccount, amount, solanaAccount, relayer) {
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
    const myPrivateKey = this.hedgehog.wallet._privKey
    const signedDigest = sign(digest, myPrivateKey)
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
}

module.exports = Wormhole
