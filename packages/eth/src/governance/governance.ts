import type { PublicClient } from 'viem'

import { abi } from './abi'
import { GOVERNANCE_CONTRACT_ADDRESS } from './constants'

export class ServiceProviderFactory {
  client: PublicClient
  address: `0x${string}`

  constructor(client: PublicClient, { address }: { address?: `0x${string}` }) {
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

  getProposalById = ({ id }: { id: number }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getProposalById',
      args: [id]
    })

  getProposalTargetContractHash = ({ id }: { id: number }) =>
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
    id: number
    voterAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getVoteInfoByProposalAndVoter',
      args: [id, voterAddress]
    })

  getProposalSubmittedEvents = ({ address }: { address: `0x${string}` }) =>
    // ProposalSubmitted
    this.client.getPastEvents({})

  getProposalOutcomeEvaluatedEvents = ({
    address
  }: {
    address: `0x${string}`
  }) =>
    // ProposalOutcomeEvaluated
    this.client.getPastEvents({})

  getProposalVoteSubmittedEvents = ({ address }: { address: `0x${string}` }) =>
    // ProposalVoteSubmitted
    this.client.getPastEvents({})

  getProposalVoteUpdatedEvents = ({ address }: { address: `0x${string}` }) =>
    // ProposalVoteUpdated
    this.client.getPastEvents({})
}
