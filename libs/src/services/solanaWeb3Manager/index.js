const solanaWeb3 = require('@solana/web3.js')
const { transferWAudioBalance } = require('./transfer')
const { getBankAccountAddress, createUserBankFrom } = require('./userBank')

const { PublicKey } = solanaWeb3

class SolanaWeb3Manager {
  constructor (solanaWeb3Config, identityService, web3Manager) {
    this.solanaWeb3Config = solanaWeb3Config
    this.identityService = identityService
    this.web3Manager = web3Manager

    this.web3 = solanaWeb3
  }

  async init () {
    const {
      solanaClusterEndpoint,
      mintAddress,
      solanaTokenAddress,
      generatedProgramPDA,
      feePayerAddress,
      audiusProgramAddress
    } = this.solanaWeb3Config
    this.solanaClusterEndpoint = solanaClusterEndpoint

    this.mintAddress = mintAddress
    this.mintKey = new PublicKey(mintAddress)

    this.solanaTokenAddress = solanaTokenAddress
    this.solanaTokenKey = new PublicKey(solanaTokenAddress)

    this.generatedProgramPDA = new PublicKey(generatedProgramPDA)

    this.feePayerAddress = feePayerAddress
    this.feePayerKey = new PublicKey(feePayerAddress)

    this.audiusProgramAddress = audiusProgramAddress
    this.audiusProgramKey = new PublicKey(audiusProgramAddress)
  }

  /**
   * Creates a solana bank account from the web3 provider's eth address
   */
  async createUserBank () {
    const ethAddress = this.web3Manager.getWalletAddress()
    await createUserBankFrom(
      ethAddress,
      this.generatedProgramPDA,
      this.feePayerKey,
      this.mintKey,
      this.solanaTokenKey,
      this.audiusProgramKey,
      this.solanaClusterEndpoint,
      this.identityService
    )
  }

  /**
   * Transfers audio from the web3 provider's eth address
   * @param {string} recipientSolanaAddress
   */
  async transferWAudio (recipientSolanaAddress) {
    const ethAddress = this.web3Manager.getWalletAddress()
    const senderSolanaAddress = await getBankAccountAddress(
      ethAddress,
      this.generatedProgramPDA,
      this.solanaTokenKey
    )
    await transferWAudioBalance(
      ethAddress,
      this.web3Manager.getOwnerWalletPrivateKey(),
      senderSolanaAddress,
      recipientSolanaAddress,
      this.generatedProgramPDA,
      this.solanaTokenKey,
      this.audiusProgramKey,
      this.solanaClusterEndpoint,
      this.identityService
    )
  }
}

module.exports = SolanaWeb3Manager
