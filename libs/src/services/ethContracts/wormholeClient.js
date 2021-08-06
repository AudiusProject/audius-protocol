const elliptic = require('elliptic')
const { utf8ToHex, toBN } = require('../../utils')

const GOVERNANCE_CHAIN_ID = "3";
const GOVERNANCE_CONTRACT = "0x0000000000000000000000000000000000000000000000000000000000000004";
const testSigner1PK = "cfb12303a19cde580bb4dd771639b0d26bc68353645571a8cff516ab2ee113a0"


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
  // async nonces (wallet) {
  //   // Pass along a unique param so the nonce value is always not cached
  //   const nonce = await this.WormholeContract.methods.nonces(wallet).call({
  //     _audiusBustCache: Date.now()
  //   })
  //   const number = this.web3.utils.toBN(nonce).toNumber()
  //   return number
  // }

  async signAndEncodeVM (
    timestamp,
    nonce,
    emitterChainId,
    emitterAddress,
    sequence,
    data,
    signers,
    guardianSetIndex,
    consistencyLevel
  ) {
    const web3 = this.web3
    const body = [
      web3.eth.abi.encodeParameter("uint32", timestamp).substring(2 + (64 - 8)),
      web3.eth.abi.encodeParameter("uint32", nonce).substring(2 + (64 - 8)),
      web3.eth.abi.encodeParameter("uint16", emitterChainId).substring(2 + (64 - 4)),
      web3.eth.abi.encodeParameter("bytes32", emitterAddress).substring(2),
      web3.eth.abi.encodeParameter("uint64", sequence).substring(2 + (64 - 16)),
      web3.eth.abi.encodeParameter("uint8", consistencyLevel).substring(2 + (64 - 2)),
      data.substr(2)
    ]

    const hash = web3.utils.soliditySha3(web3.utils.soliditySha3("0x" + body.join("")))

    let signatures = "";

    for (let i in signers) {
      const ec = new elliptic.ec("secp256k1");
      const key = ec.keyFromPrivate(signers[i]);
      const signature = key.sign(hash.substr(2), {canonical: true});

      const packSig = [
        web3.eth.abi.encodeParameter("uint8", i).substring(2 + (64 - 2)),
        this.zeroPadBytes(signature.r.toString(16), 32),
        this.zeroPadBytes(signature.s.toString(16), 32),
        web3.eth.abi.encodeParameter("uint8", signature.recoveryParam).substr(2 + (64 - 2)),
      ]

      signatures += packSig.join("")
    }

    const vm = [
      web3.eth.abi.encodeParameter("uint8", 1).substring(2 + (64 - 2)),
      web3.eth.abi.encodeParameter("uint32", guardianSetIndex).substring(2 + (64 - 8)),
      web3.eth.abi.encodeParameter("uint8", signers.length).substring(2 + (64 - 2)),

      signatures,
      body.join("")
    ].join("");

    return vm
  }

  zeroPadBytes(value, length, padRight = false) {
    while (value.length < 2 * length) {
      if (padRight) {
        value = value + "0"
      } else {
        value = "0" + value
      }
    }
    return value
  }

  hexToZeroPaddedBytes(value, length, padRight = false) {
    return this.zeroPadBytes(value.slice(2), length, padRight)
  }

  /* ------- WORMHOLE SETUP ------- */

  async registerChain ({
    foreignChainId,
    foreignBridgeContract,
  }) {
    const paddedForeignBridgeContract = '0x' + this.zeroPadBytes(foreignBridgeContract, 32)
    const web3 = this.web3

    // Register chain/contract
    const data = [
      "0x",
      // Token bridge
      "000000000000000000000000000000000000000000546f6b656e427269646765",
      // Governance action identifier
      "01",
      // Target Chain (Where the governance action should be applied)
      // 0 is all chains
      "0000",
      // Foreign chain id
      web3.eth.abi.encodeParameter("uint16", foreignChainId).substring(2 + (64 - 4)),
      // Foreign chain bridge contract
      web3.eth.abi.encodeParameter("bytes32", paddedForeignBridgeContract).substring(2),
    ].join('')

    const vm = await this.signAndEncodeVM(
      1,
      1,
      GOVERNANCE_CHAIN_ID,
      GOVERNANCE_CONTRACT,
      0,
      data,
      [
        testSigner1PK
      ],
      0,
      0
    )

    const registerMethod = await this.WormholeContract.methods.registerChain("0x" + vm)
    const tx = await this.ethWeb3Manager.sendTransaction(registerMethod)
    const bridged = await this.WormholeContract.methods.bridgeContracts(foreignChainId).call()
    console.log(`Registered ${bridged} at chainId: ${foreignChainId}`)
    return tx
  }

  async createWrappedAudio ({
    foreignChainId,
  }) {
    const foreignBridgeContract = await this.WormholeContract.methods.bridgeContracts(foreignChainId).call()

    const symbol = this.hexToZeroPaddedBytes(utf8ToHex('AUDIO'), 32, true)
    const name = this.hexToZeroPaddedBytes(utf8ToHex('AUDIO'), 32, true)
    const audioAddress = this.hexToZeroPaddedBytes(this.audiusTokenClient.contractAddress, 32)

    const paddedForeignChainId = this.zeroPadBytes(foreignChainId, 2)
    // Create wrapped asset
    const data = [
      "0x02",
      // tokenAddress
      audioAddress,
      // tokenchain
      paddedForeignChainId,
      // decimals
      "18",
      // symbol
      symbol,
      // name
      name
    ].join('')

    const vm = await this.signAndEncodeVM(
      0,
      0,
      foreignChainId,
      foreignBridgeContract,
      0,
      data,
      [
        testSigner1PK
      ],
      0,
      0
    )
    const method = await this.WormholeContract.methods.createWrapped("0x" + vm)
    const tx = await this.ethWeb3Manager.sendTransaction(method)

    const wrappedAddress = await this.WormholeContract.methods.wrappedAsset("0x" + paddedForeignChainId, "0x" + audioAddress).call()
    console.info(`Created wrapped asset ${wrappedAddress} on chainId: ${foreignChainId}`)

    return tx
  }

  /* ------- WORMHOLE INTERACTION ------- */

  async transferTokens ({
    amount,
    recipient,
    recipientChainId = "1",
    fee = "000000000000000000"
  }) {
    const audioTokenAddress = this.hexToZeroPaddedBytes(this.audiusTokenClient.contractAddress, 32)

    // Approve the transfer so the bridge may withdraw
    await this.audiusTokenClient.approve(this.contractAddress, amount)

    const nonce = await this.web3.eth.getTransactionCount(this.ethWeb3Manager.ownerWallet)
    console.log({nonce})
    const method = await this.WormholeContract.methods.transferTokens(
      this.audiusTokenClient.contractAddress,
      amount,
      recipientChainId,
      "0x" + this.hexToZeroPaddedBytes(recipient),
      fee,
      /* nonce */ nonce
    )

    const tx = await this.ethWeb3Manager.sendTransaction(method)

    const myBalance = await this.audiusTokenClient.balanceOf(this.ethWeb3Manager.ownerWallet)
    const bridgeBalance = await this.audiusTokenClient.balanceOf(this.contractAddress)
    console.info(`Transfered to bridge. My balance: ${myBalance}, bridge balance: ${bridgeBalance}`)  

    return tx
  }

  async completeTransfer ({
    amount,
    recipient,
    tokenChainId,
    recipientChainId = '1',
    fee = "0000000000000000000000000000000000000000000000000000000000000000"
  }) {
    const web3 = this.web3
    const foreignBridgeContract = await this.WormholeContract.methods.bridgeContracts(recipientChainId).call()

    const data = [
      "0x",
      "01",
      // amount
      web3.eth.abi.encodeParameter("uint256", toBN(amount).div(toBN('10000000000'))).substring(2),
      // tokenaddress
      web3.eth.abi.encodeParameter("address", this.audiusTokenClient.contractAddress).substr(2),
      // token chain id
      web3.eth.abi.encodeParameter("uint16", tokenChainId).substring(2 + (64 - 4)),
      // recipient
      web3.eth.abi.encodeParameter("address", recipient).substr(2),
      // recipient chain id
      web3.eth.abi.encodeParameter("uint16", tokenChainId).substring(2 + (64 - 4)),
      // fee
      fee
    ].join('')

    const vm = await this.signAndEncodeVM(
      0,
      0,
      recipientChainId,
      foreignBridgeContract,
      0,
      data,
      [
        testSigner1PK
      ],
      0,
      0
    )
    const method = await this.WormholeContract.methods.completeTransfer("0x" + vm)
    const tx = await this.ethWeb3Manager.sendTransaction(method)

    const myBalance = await this.audiusTokenClient.balanceOf(this.ethWeb3Manager.ownerWallet)
    const bridgeBalance = await this.audiusTokenClient.balanceOf(this.contractAddress)
    console.info(`Completed transfer. My balance: ${myBalance}, bridge balance: ${bridgeBalance}`)  

    return tx
  }
}

module.exports = WormholeClient
