import type { PublicClient } from 'viem'
import type { GetContractEventsParameters } from 'viem/_types/actions/public/getContractEvents'

import { abi } from './abi'
import { GOVERNANCE_CONTRACT_ADDRESS } from './constants'

export class Governance {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? GOVERNANCE_CONTRACT_ADDRESS
  }

  getVotingPeriod = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getVotingPeriod'
    })

  getVotingQuorumPercent = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getVotingQuorumPercent'
    })

  getExecutionDelay = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getExecutionDelay'
    })

  getProposalById = ({ id }: { id: bigint }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getProposalById',
      args: [id]
    })

  getProposalTargetContractHash = ({ id }: { id: bigint }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getProposalTargetContractHash',
      args: [id]
    })

  getInProgressProposals = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getInProgressProposals'
    })

  getVoteInfoByProposalAndVoter = ({
    id,
    voterAddress
  }: {
    id: bigint
    voterAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getVoteInfoByProposalAndVoter',
      args: [id, voterAddress]
    })

  getProposalSubmittedEvents = ({
    fromBlock = BigInt(0),
    proposalId,
    proposer
  }: {
    fromBlock: bigint
    proposalId?: bigint
    proposer?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof abi,
      'ProposalSubmitted'
    >['args'] = {}

    if (proposalId) args._proposalId = proposalId
    if (proposer) args._proposer = proposer

    return this.client.getContractEvents({
      address: this.address,
      abi,
      eventName: 'ProposalSubmitted',
      fromBlock,
      args
    })
  }

  getProposalOutcomeEvaluatedEvents = ({
    fromBlock = BigInt(0),
    proposalId
  }: {
    fromBlock: bigint
    proposalId?: bigint
  }) => {
    const args: GetContractEventsParameters<
      typeof abi,
      'ProposalOutcomeEvaluated'
    >['args'] = {}

    if (proposalId) args._proposalId = proposalId

    return this.client.getContractEvents({
      address: this.address,
      abi,
      eventName: 'ProposalOutcomeEvaluated',
      fromBlock,
      args
    })
  }

  getProposalVoteSubmittedEvents = ({
    fromBlock = BigInt(0),
    proposalId,
    voter
  }: {
    fromBlock: bigint
    proposalId?: bigint
    voter?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof abi,
      'ProposalVoteSubmitted'
    >['args'] = {}

    if (proposalId) args._proposalId = proposalId
    if (voter) args._voter = voter

    return this.client.getContractEvents({
      address: this.address,
      abi,
      eventName: 'ProposalVoteSubmitted',
      fromBlock,
      args
    })
  }

  getProposalVoteUpdatedEvents = ({
    fromBlock = BigInt(0),
    proposalId,
    voter
  }: {
    fromBlock: bigint
    proposalId?: bigint
    voter?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof abi,
      'ProposalVoteUpdated'
    >['args'] = {}

    if (proposalId) args._proposalId = proposalId
    if (voter) args._voter = voter

    return this.client.getContractEvents({
      address: this.address,
      abi,
      eventName: 'ProposalVoteUpdated',
      fromBlock,
      args
    })
  }
}
