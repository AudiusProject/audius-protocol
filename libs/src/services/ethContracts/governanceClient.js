const ContractClient = require('../contracts/ContractClient')

const DEFAULT_GAS_AMOUNT = 200000

/**
 * Transform a method name and its argument types into a string-composed
 * signature, e.g. someMethod(bytes32, int32)
 * @param {string} methodName
 * @param {Array<string>} argumentTypes
 */
const createMethodSignature = (methodName, argumentTypes) => {
  return `${methodName}(${argumentTypes.join(',')})`
}

/**
 * Represent an instance of a proposal vote.
 */
const Vote = Object.freeze({
  no: 1,
  yes: 2
})

class GovernanceClient extends ContractClient {
  constructor (
    ethWeb3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    audiusTokenClient,
    stakingProxyClient,
    isDebug = false
  ) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
    this.isDebug = isDebug
    this.formatVote = this.formatVote.bind(this)
    this.formatProposalEvent = this.formatProposalEvent.bind(this)
  }

  /**
   * Gets the function signature and call data for a contract method.
   * The signature and call data are passed to other contracts (like governance)
   * as arguments.
   * @param {string} methodName
   * @param {Contract.method} contractMethod
   */
  getSignatureAndCallData (methodName, contractMethod) {
    const argumentTypes = contractMethod._method.inputs.map(i => i.type)
    const argumentValues = contractMethod.arguments

    const signature = createMethodSignature(methodName, argumentTypes)
    const callData = this.abiEncode(argumentTypes, argumentValues)

    return { signature, callData }
  }

  async guardianExecuteTransaction (
    contractRegistryKey,
    functionSignature,
    callData
  ) {
    // 0 eth valued transaction. We don't anticipate needed to attach
    // value to this txn, so default to 0.
    const callValue0 = this.toBN(0)

    const method = await this.getMethod(
      'guardianExecuteTransaction',
      contractRegistryKey,
      callValue0,
      functionSignature,
      callData
    )
    return method
  }

  async getVotingPeriod () {
    const method = await this.getMethod('getVotingPeriod')
    const period = await method.call()
    return parseInt(period)
  }

  async setVotingPeriod (
    period
  ) {
    const methodName = 'setVotingPeriod'
    const contractMethod = await this.getMethod(methodName, period)
    const { signature, callData } = this.getSignatureAndCallData(methodName, contractMethod)
    const contractRegistryKey = this.web3Manager.getWeb3().utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }

  async getVotingQuorumPercent () {
    const method = await this.getMethod('getVotingQuorumPercent')
    const percent = await method.call()
    return parseInt(percent)
  }

  async getExecutionDelay () {
    const method = await this.getMethod('getExecutionDelay')
    const delay = await method.call()
    return parseInt(delay)
  }

  async getMaxDescriptionLength () {
    const method = await this.getMethod('getMaxDescriptionLength')
    const length = await method.call()
    return parseInt(length)
  }

  async setExecutionDelay (
    delay
  ) {
    const methodName = 'setExecutionDelay'
    const contractMethod = await this.getMethod(methodName, delay)
    const { signature, callData } = this.getSignatureAndCallData(methodName, contractMethod)
    const contractRegistryKey = this.web3Manager.getWeb3().utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }

  async getProposalById (
    id
  ) {
    const method = await this.getMethod(
      'getProposalById',
      id
    )
    const proposal = await method.call()
    const formattedProposal = this.formatProposal(proposal)
    return formattedProposal
  }

  async getProposalDescriptionById (
    id
  ) {
    const method = await this.getMethod(
      'getProposalDescriptionById',
      id
    )
    return method.call()
  }

  async getProposalTargetContractHash (
    id
  ) {
    const method = await this.getMethod(
      'getProposalTargetContractHash',
      id
    )
    return method.call()
  }

  async getProposals (queryStartBlock = 0) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalSubmitted', {
      fromBlock: queryStartBlock
    })
    return events.map(this.formatProposalEvent)
  }

  async getInProgressProposals () {
    const method = await this.getMethod('getInProgressProposals')
    const ids = await method.call()
    return ids
  }

  async submitProposal ({
    targetContractRegistryKey,
    callValue,
    functionSignature,
    callData, // array of args, e.g. [slashAmount, targetAddress]
    description
  }) {
    const argumentTypes = functionSignature.match(/.*\((?<args>.*)\)/).groups.args.split(',')
    const encodedCallData = this.abiEncode(argumentTypes, callData)

    const method = await this.getMethod(
      'submitProposal',
      targetContractRegistryKey,
      callValue,
      functionSignature,
      encodedCallData,
      description
    )
    // Increased gas because submitting can be expensive
    const tx = await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT * 2)
    if (tx && tx.events && tx.events.ProposalSubmitted && tx.events.ProposalSubmitted.returnValues) {
      const id = tx.events.ProposalSubmitted.returnValues.proposalId
      return id
    }
    throw new Error('submitProposal: txn malformed')
  }

  async submitVote ({
    proposalId,
    vote
  }) {
    const method = await this.getMethod(
      'submitVote',
      proposalId,
      vote
    )
    await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }

  async updateVote ({
    proposalId,
    vote
  }) {
    const method = await this.getMethod(
      'updateVote',
      proposalId,
      vote
    )
    await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }

  async evaluateProposalOutcome (
    proposalId
  ) {
    const method = await this.getMethod(
      'evaluateProposalOutcome',
      proposalId
    )
    // Increase gas because evaluating proposals can be expensive
    const outcome = await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT * 2)
    return outcome
  }

  async getProposalEvaluation (
    proposalId,
    queryStartBlock = 0
  ) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalOutcomeEvaluated', {
      fromBlock: queryStartBlock,
      filter: {
        proposalId: proposalId
      }
    })
    return events
  }

  async getVotes ({
    proposalId,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalVoteSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        proposalId: proposalId
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteUpdates ({
    proposalId,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalVoteUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        proposalId: proposalId
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteSubmissionsByAddress ({
    addresses,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalVoteSubmitted', {
      fromBlock: queryStartBlock,
      filter: {
        voter: addresses
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteUpdatesByAddress ({
    addresses,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents('ProposalVoteUpdated', {
      fromBlock: queryStartBlock,
      filter: {
        voter: addresses
      }
    })
    return events.map(this.formatVote)
  }

  async getVoteByProposalAndVoter ({
    proposalId,
    voterAddress
  }) {
    const method = await this.getMethod(
      'getVoteByProposalAndVoter',
      proposalId,
      voterAddress
    )
    const vote = await method.call()
    return parseInt(vote)
  }

  // Helpers

  /**
   * ABI encodes argument types and values together into one encoded string
   * @param {Array<string>} types
   * @param {Array<string>} values
   */
  abiEncode (types, values) {
    return this.web3Manager.getWeb3().eth.abi.encodeParameters(types, values)
  }

  toBN (val) {
    return this.web3Manager.getWeb3().utils.toBN(val)
  }

  /**
   * Prune off extraneous fields from proposal returned by txn
   */
  formatProposal (proposal) {
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
  formatProposalEvent (proposalEvent) {
    const event = proposalEvent.returnValues
    return {
      proposalId: parseInt(event.proposalId),
      proposer: event.proposer,
      submissionBlockNumber: parseInt(event.submissionBlockNumber),
      description: event.description
    }
  }

  /**
   * Prune off extraneous fields from vote event
   */
  formatVote (voteEvent) {
    const event = voteEvent.returnValues
    return {
      proposalId: parseInt(event.proposalId),
      voter: event.voter,
      vote: parseInt(event.vote),
      voterStake: this.toBN(event.voterStake)
    }
  }
}

module.exports = { GovernanceClient, Vote }
