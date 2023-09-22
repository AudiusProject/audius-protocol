import type { EventLog } from 'web3-core'

import { ContractABI, ContractMethod, Logger, Utils } from '../../utils'
import { ContractClient, GetRegistryAddress } from '../contracts/ContractClient'
import type { EthWeb3Manager } from '../ethWeb3Manager'

import type { AudiusTokenClient } from './AudiusTokenClient'
import type { StakingProxyClient } from './StakingProxyClient'

type ProposalTxn = {
  proposalId: string
  proposer: string
  submissionBlockNumber: string
  targetContractRegistryKey: string
  targetContractAddress: string
  callValue: string
  functionSignature: string
  callData: string
  outcome: string
  numVotes: string
  voteMagnitudeYes: string
  voteMagnitudeNo: string
}

/**
 * Transform a method name and its argument types into a string-composed
 * signature, e.g. someMethod(bytes32, int32)
 * @param methodName
 * @param argumentTypes
 */
const createMethodSignature = (methodName: string, argumentTypes: string[]) => {
  return `${methodName}(${argumentTypes.join(',')})`
}

/**
 * Represent an instance of a proposal vote.
 */
export const Vote = Object.freeze({
  no: 1,
  yes: 2
})

export class GovernanceClient extends ContractClient {
  audiusTokenClient: AudiusTokenClient
  stakingProxyClient: StakingProxyClient
  isDebug: boolean

  constructor(
    ethWeb3Manager: EthWeb3Manager,
    contractABI: ContractABI['abi'],
    contractRegistryKey: string,
    getRegistryAddress: GetRegistryAddress,
    audiusTokenClient: AudiusTokenClient,
    stakingProxyClient: StakingProxyClient,
    logger: Logger = console,
    isDebug = false
  ) {
    super(
      ethWeb3Manager,
      contractABI,
      contractRegistryKey,
      getRegistryAddress,
      logger
    )
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
    this.isDebug = isDebug
    this.formatVote = this.formatVote.bind(this)
    this.formatProposalEvent = this.formatProposalEvent.bind(this)
    this.abiEncode = this.abiEncode.bind(this)
  }

  /**
   * Gets the function signature and call data for a contract method.
   * The signature and call data are passed to other contracts (like governance)
   * as arguments.
   * @param methodName
   * @param contractMethod
   */
  getSignatureAndCallData(methodName: string, contractMethod: ContractMethod) {
    const argumentTypes = contractMethod._method.inputs.map((i) => i.type)
    const argumentValues = contractMethod.arguments

    const signature = createMethodSignature(methodName, argumentTypes)
    const callData = this.abiEncode(argumentTypes, argumentValues)

    return { signature, callData }
  }

  async guardianExecuteTransaction(
    contractRegistryKey: string,
    functionSignature: string,
    callData: string
  ): Promise<ContractMethod> {
    // 0 eth valued transaction. We don't anticipate needed to attach
    // value to this txn, so default to 0.
    const callValue0 = this.toBN('0')

    const method = await this.getMethod(
      'guardianExecuteTransaction',
      contractRegistryKey,
      callValue0,
      functionSignature,
      callData
    )
    return method
  }

  async getVotingPeriod() {
    const method = await this.getMethod('getVotingPeriod')
    const period = await method.call()
    return parseInt(period)
  }

  async setVotingPeriod(period: string) {
    const methodName = 'setVotingPeriod'
    const contractMethod = await this.getMethod(methodName, period)
    const { signature, callData } = this.getSignatureAndCallData(
      methodName,
      contractMethod
    )
    const contractRegistryKey = this.web3Manager
      .getWeb3()
      .utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return await this.web3Manager.sendTransaction(method)
  }

  async getVotingQuorumPercent() {
    const method = await this.getMethod('getVotingQuorumPercent')
    const percent = await method.call()
    return parseInt(percent)
  }

  async getExecutionDelay() {
    const method = await this.getMethod('getExecutionDelay')
    const delay = await method.call()
    return parseInt(delay)
  }

  async setExecutionDelay(delay: number) {
    const methodName = 'setExecutionDelay'
    const contractMethod = await this.getMethod(methodName, delay)
    const { signature, callData } = this.getSignatureAndCallData(
      methodName,
      contractMethod
    )
    const contractRegistryKey = this.web3Manager
      .getWeb3()
      .utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return await this.web3Manager.sendTransaction(method)
  }

  async getProposalById(id: number) {
    const method = await this.getMethod('getProposalById', id)
    const proposal = await method.call()
    const formattedProposal = this.formatProposal(proposal)
    return formattedProposal
  }

  async getProposalTargetContractHash(id: string) {
    const method = await this.getMethod('getProposalTargetContractHash', id)
    return method.call()
  }

  async getProposals(queryStartBlock = 0) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalSubmitted', {
      fromBlock: queryStartBlock
    })
    return events?.map(this.formatProposalEvent)
  }

  async getProposalsForAddresses(addresses: string[], queryStartBlock = 0) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        _proposer: addresses
      }
    })
    return events.map(this.formatProposalEvent)
  }

  async getProposalSubmission(proposalId: number, queryStartBlock = 0) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        _proposalId: proposalId
      }
    })
    return this.formatProposalEvent(events[0] as EventLog)
  }

  async getInProgressProposals() {
    const method = await this.getMethod('getInProgressProposals')
    const ids = await method.call()
    return ids
  }

  async submitProposal({
    targetContractRegistryKey,
    callValue,
    functionSignature,
    callData, // array of args, e.g. [slashAmount, targetAddress]
    name,
    description
  }: {
    targetContractRegistryKey: string
    callValue: string
    functionSignature: string
    callData: string[] // array of args, e.g. [slashAmount, targetAddress]
    name: string
    description: string
  }) {
    const argumentTypes = functionSignature
      .match(/.*\((?<args>.*)\)/)
      ?.groups?.args?.split(',')
    const encodedCallData = this.abiEncode(argumentTypes as string[], callData)

    const method = await this.getMethod(
      'submitProposal',
      targetContractRegistryKey,
      callValue,
      functionSignature,
      encodedCallData,
      name,
      description
    )
    const tx = await this.web3Manager.sendTransaction(method)
    const id = tx.events?.ProposalSubmitted?.returnValues?._proposalId
    if (id) {
      return id
    }
    throw new Error('submitProposal: txn malformed')
  }

  async submitVote({ proposalId, vote }: { proposalId: number; vote: string }) {
    const method = await this.getMethod('submitVote', proposalId, vote)
    await this.web3Manager.sendTransaction(method)
  }

  async updateVote({ proposalId, vote }: { proposalId: number; vote: string }) {
    const method = await this.getMethod('updateVote', proposalId, vote)
    await this.web3Manager.sendTransaction(method)
  }

  async evaluateProposalOutcome(proposalId: number) {
    const method = await this.getMethod('evaluateProposalOutcome', proposalId)
    const outcome = await this.web3Manager.sendTransaction(method)
    return outcome
  }

  async getProposalEvaluation(proposalId: number, queryStartBlock = 0) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalOutcomeEvaluated', {
      fromBlock: queryStartBlock,
      filter: {
        _proposalId: proposalId
      }
    })
    return events
  }

  async getVotes({
    proposalId,
    queryStartBlock = 0
  }: {
    proposalId: number
    queryStartBlock: number
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalVoteSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        _proposalId: proposalId
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteUpdates({
    proposalId,
    queryStartBlock = 0
  }: {
    proposalId: number
    queryStartBlock: number
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalVoteUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        _proposalId: proposalId
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteSubmissionsByAddress({
    addresses,
    queryStartBlock = 0
  }: {
    addresses: string[]
    queryStartBlock: number
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalVoteSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        _voter: addresses
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteUpdatesByAddress({
    addresses,
    queryStartBlock = 0
  }: {
    addresses: string[]
    queryStartBlock: number
  }) {
    const contract = await this.getContract()
    const events = await contract.getPastEvents('ProposalVoteUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        _voter: addresses
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteByProposalAndVoter({
    proposalId,
    voterAddress
  }: {
    proposalId: number[]
    voterAddress: number
  }) {
    const method = await this.getMethod(
      'getVoteInfoByProposalAndVoter',
      proposalId,
      voterAddress
    )
    const result = await method.call()
    return parseInt(result.vote)
  }

  // Helpers

  /**
   * ABI encodes argument types and values together into one encoded string
   */
  abiEncode(types: string[], values: string[]) {
    return this.web3Manager.getWeb3().eth.abi.encodeParameters(types, values)
  }

  toBN(val: string) {
    return this.web3Manager.getWeb3().utils.toBN(val)
  }

  /**
   * Prune off extraneous fields from proposal returned by txn
   */
  formatProposal(proposal: ProposalTxn) {
    return {
      proposalId: parseInt(proposal.proposalId),
      proposer: proposal.proposer,
      submissionBlockNumber: parseInt(proposal.submissionBlockNumber),
      targetContractRegistryKey: proposal.targetContractRegistryKey,
      targetContractAddress: proposal.targetContractAddress,
      callValue: parseInt(proposal.callValue),
      functionSignature: proposal.functionSignature,
      callData: proposal.callData,
      outcome: parseInt(proposal.outcome),
      numVotes: parseInt(proposal.numVotes),
      voteMagnitudeYes: this.toBN(proposal.voteMagnitudeYes),
      voteMagnitudeNo: this.toBN(proposal.voteMagnitudeNo)
    }
  }

  /**
   * Formats a proposal event
   */
  formatProposalEvent(proposalEvent: EventLog) {
    const event = proposalEvent.returnValues
    return {
      proposalId: parseInt(event._proposalId),
      proposer: event._proposer,
      description: event._description,
      name: event._name,
      blockNumber: proposalEvent.blockNumber
    }
  }

  /**
   * Prune off extraneous fields from vote event
   */
  formatVote(voteEvent: EventLog) {
    const event = voteEvent.returnValues
    return {
      proposalId: parseInt(event._proposalId),
      voter: event._voter,
      vote: parseInt(event._vote),
      voterStake: this.toBN(event._voterStake),
      blockNumber: voteEvent.blockNumber
    }
  }

  /**
   *
   * @param {Number} proposalId id of the governance proposal
   * @returns {BN} amount of tokens in wei required to reach quorum
   */
  async calculateQuorum(proposalId: number) {
    const { submissionBlockNumber } = await this.getProposalById(proposalId)

    // represented as a value > 0, eg 5% is 5
    const quoroumPercent = await this.getVotingQuorumPercent()

    // retrieve stake at the time of proposal from Staking client
    const totalStakeAtProposal = await this.stakingProxyClient.totalStakedAt(
      submissionBlockNumber
    )

    // quorum = (total staked at proposal * quorum percent) / 100
    // the divmod function returns an object with both the quotient (div) and the remainder (mod)
    // { div, mod }
    const quorumStakeDivMod = totalStakeAtProposal
      .mul(Utils.toBN(quoroumPercent))
      // @ts-expect-error divmod not in types for some reason
      .divmod(Utils.toBN(100))

    let quorumStake = quorumStakeDivMod.div

    // if there's a non-zero remainder, round up
    if (!quorumStakeDivMod.mod.isZero()) {
      quorumStake = quorumStakeDivMod.div.add(Utils.toBN(1))
    }

    return quorumStake
  }
}
