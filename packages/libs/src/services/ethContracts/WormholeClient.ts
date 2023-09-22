import type BN from 'bn.js'
import type { ECDSASignature } from 'ethereumjs-util'
import type Web3 from 'web3'
import type { Contract } from 'web3-eth-contract'

import type { ContractABI } from '../../utils'
import type { EthWeb3Manager } from '../ethWeb3Manager'

import type { AudiusTokenClient } from './AudiusTokenClient'

export class WormholeClient {
  ethWeb3Manager: EthWeb3Manager
  contractABI: ContractABI['abi']
  contractAddress: string
  web3: Web3
  audiusTokenClient: AudiusTokenClient
  WormholeContract: Contract

  constructor(
    ethWeb3Manager: EthWeb3Manager,
    contractABI: ContractABI['abi'],
    contractAddress: string,
    audiusTokenClient: AudiusTokenClient
  ) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.ethWeb3Manager.getWeb3()
    this.audiusTokenClient = audiusTokenClient
    this.WormholeContract = new this.web3.eth.Contract(
      this.contractABI,
      this.contractAddress
    )
  }

  // Get the name of the contract
  async nonces(wallet: string) {
    // Pass along a unique param so the nonce value is always not cached
    const nonce = await this.WormholeContract.methods.nonces(wallet).call({
      _audiusBustCache: Date.now()
    })
    const number = this.web3.utils.toBN(nonce).toNumber()
    return number
  }

  /* ------- SETTERS ------- */

  async initialize(fromAcct: string, wormholeAddress: string, relayer: string) {
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
   */
  async transferTokens(
    fromAcct: string,
    amount: BN,
    chainId: number,
    solanaAccount: Buffer,
    arbiterFee: BN,
    deadline: number,
    signedDigest: ECDSASignature,
    relayer: string
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
