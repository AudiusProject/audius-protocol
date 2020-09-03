const GovernedContractClient = require('../contracts/GovernedContractClient')

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
 * Prune off extraneous fields from proposal returned by txn
 */
const formatProposal = (proposal) => ({
  proposalId: parseInt(proposal.proposalId),
  proposer: proposal.proposer,
  submissionBlockNumber: parseInt(proposal.submissionBlockNumber),
  targetContractRegistryKey: proposal.targetContractRegistryKey,
  targetContractAddress: proposal.targetContractAddress,
  callValue: parseInt(proposal.callValue),
  functionSigntaure: proposal.functionSignature,
  callData: proposal.callData,
  outcome: parseInt(proposal.outcome),
  numVotes: parseInt(proposal.numVotes),
  /* voteMagnitude can be extremely large (sum of stakes), so left as strings*/
  voteMagnitudeYes: proposal.voteMagnitudeYes,
  voteMagnitudeNo: proposal.voteMagnitudeNo,
})



/**
 * Prune off extraneous fields from vote event
 */
const formatVote = (voteEvent) => {
  const event = voteEvent.returnValues
  return {
    proposalId: event.proposalId,
    voter: event.voter,
    vote: event.vote,
    voterStake: event.voterStake
  }
}

class GovernanceClient extends GovernedContractClient {

  /**
   * Represent an instance of a proposal vote.
   *
   * @static
   * @memberof GovernanceClient
   */
  static Vote = Object.freeze({
    no: 1,
    yes: 2
  })

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
  }

  /**
   * Gets the function signature and call data for a contract method.
   * The signature and call data are passed to other contracts (like governance)
   * as arguments.
   * @param {string} methodName
   * @param {Contract.method} contractMethod
   */
  getSignatureAndCallData (methodName, contractMethod) {
    const web3 = this.web3Manager.getWeb3()

    const argumentTypes = contractMethod._method.inputs.map(i => i.type)
    const argumentValues = contractMethod.arguments

    const signature = createMethodSignature(methodName, argumentTypes)
    const callData = this.abiEncode(web3, argumentTypes, argumentValues)

    return { signature, callData }
  }

  async guardianExecuteTransaction (
    contractRegistryKey,
    functionSignature,
    callData
  ) {
    // 0 eth valued transaction. We don't anticipate needed to attach
    // value to this txn, so default to 0.
    const callValue0 = this.web3Manager.getWeb3().utils.toBN(0)

    const method = await this.getMethod(
      'guardianExecuteTransaction',
      contractRegistryKey,
      callValue0,
      functionSignature,
      callData
    )
    return method
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

  async getProposalById({
    id
  }) {
    const method = await this.getMethod(
      'getProposalById',
      id
    )
    const proposal = await method.call()
    const formattedProposal = formatProposal(proposal)
    return formattedProposal
  }

  async getProposalDescriptionById({
    id
  }) {
    const method = await this.getMethod(
      'getProposalDescriptionById',
      id
    )
    return method.call()
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
    callData,
    description}) {
      const method = await this.getMethod(
        'submitProposal',
        targetContractRegistryKey,
        callValue,
        functionSignature,
        callData,
        description,
      )
      const tx = await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT * 10)
      if (tx && tx.events && tx.events.ProposalSubmitted && tx.events.ProposalSubmitted.returnValues) {
        const id = tx.events.ProposalSubmitted.returnValues.proposalId
        return id
      }
      throw new Error("No proposal Id")

  }

  async submitVote({
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

  async updateVote({
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

  async evaluateProposalOutcome({
    proposalId
  }) {
    const method = await this.getMethod(
      'evaluateProposalOutcome',
      proposalId
    )
    const outcome = await this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT * 2)
    return outcome
  }

  async getVotes({
    proposalId,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents("ProposalVoteSubmitted", {
      fromBlock: queryStartBlock,
      filter: {
        proposalId: proposalId
      }
    })
    return events.map(formatVote)
  }

  async getVoteUpdates({
    proposalId,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents("ProposalVoteUpdated", {
      fromBlock: queryStartBlock,
      filter: {
        proposalId: proposalId
      }
    })
    return events.map(formatVote)
  }

  async getVoteSubmissionsByAddress({
    addresses,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents("ProposalVoteSubmitted", {
      fromBlock: queryStartBlock,
      filter: {
        voter: addresses
      }
    })
    return events.map(formatVote)
  }

  async getVoteUpdatesByAddress({
    addresses,
    queryStartBlock = 0
  }) {
    const contract = await this.getContract()
    let events = await contract.getPastEvents("ProposalVoteUpdated", {
      fromBlock: queryStartBlock,
      filter: {
        voter: addresses
      }
    })
    return events.map(formatVote)
  }


  // Helpers

  /**
   * ABI encodes argument types and values together into one encoded string
   * @param {Web3} web3
   * @param {Array<string>} types
   * @param {Array<string>} values
   */
  abiEncode(web3, types, values) {
    return web3.eth.abi.encodeParameters(types, values)
  }
}

module.exports = GovernanceClient
