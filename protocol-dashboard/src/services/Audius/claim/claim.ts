import { AudiusClient } from '../AudiusClient'
import BN from 'bn.js'
import { BlockNumber, Address } from 'types'
import { ClaimProcessedEvent } from 'models/TimelineEvents'
import { GetClaimProcessedResponse } from './types'

export interface TransactionReceipt {
  status: boolean
  transactionHash: string
  transactionIndex: number
  blockHash: string
  blockNumber: number
  from: string
  to: string
  contractAddress?: string
  cumulativeGasUsed: number
  gasUsed: number
  effectiveGasPrice: number
  logs: any[]
  logsBloom: string
  events?: {
    [eventName: string]: any
  }
}

export default class Claim {
  aud: AudiusClient

  constructor(aud: AudiusClient) {
    this.aud = aud
  }

  getContract() {
    return this.aud.libs.ethContracts.ClaimsManagerClient
  }

  /* -------------------- Claims Manager Client Read -------------------- */

  // Get the duration of a funding round in blocks
  async getFundingRoundBlockDiff(): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getFundingRoundBlockDiff()
    return info
  }

  // Get the last block where a funding round was initiated
  async getLastFundedBlock(): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getLastFundedBlock()
    return info
  }

  // Get the amount funded per round in wei
  async getFundsPerRound(): Promise<BN> {
    await this.aud.hasPermissions()
    const claimAmount = await this.getContract().getFundsPerRound()
    return new BN(claimAmount)
  }

  // Get the total amount claimed in the current round
  async getTotalClaimedInRound(): Promise<BN> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getTotalClaimedInRound()
    return info
  }

  // Get the Governance address
  async getGovernanceAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getGovernanceAddress()
    return info
  }

  // Get the ServiceProviderFactory address
  async getServiceProviderFactoryAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getServiceProviderFactoryAddress()
    return info
  }

  // Get the DelegateManager address
  async getDelegateManagerAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDelegateManagerAddress()
    return info
  }

  // Get the Staking address
  async getStakingAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getStakingAddress()
    return info
  }

  // Returns boolean indicating whether a claim is considered pending
  async claimPending(address: Address): Promise<boolean> {
    await this.aud.hasPermissions()
    const info = await this.getContract().claimPending(address)
    return info
  }

  // Returns transaction receipt
  async initiateRound(): Promise<TransactionReceipt> {
    await this.aud.hasPermissions()
    await this.getContract().init()
    const info = await this.getContract().initiateRound()
    return info
  }

  async getCurrentRound() {
    await this.aud.hasPermissions()
    await this.getContract().init()
    const contractAddress = this.getContract()._contractAddress
    const latestFundedBlockNumber = await this.getLastFundedBlock()
    const logs = await this.aud.libs.ethWeb3Manager.getWeb3().eth.getPastLogs({
      address: contractAddress,
      fromBlock: latestFundedBlockNumber,
      toBlock: latestFundedBlockNumber
    })
    const roundNumber = logs?.[1].topics?.[2]
    return roundNumber ? parseInt(roundNumber, 16) : null
  }

  async getClaimProcessedEvents(
    claimer: Address
  ): Promise<ClaimProcessedEvent[]> {
    await this.aud.hasPermissions()
    const info: GetClaimProcessedResponse[] = await this.getContract().getClaimProcessedEvents(
      {
        claimer
      }
    )
    return info.map(e => ({
      ...e,
      _type: 'ClaimProcessed'
    }))
  }
}
