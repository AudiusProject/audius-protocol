import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Proposal, Outcome } from 'types'

export type State = {
  // Ordered array of active proposals
  activeProposals: Proposal[] | null
  // Mapping of all proposals, keyed by proposal id
  allProposals: { [key: number]: Proposal }
  // Ordered array recent proposals
  resolvedProposals: number[] | null
  // Voting period to determine when votes are due
  votingPeriod: number | null
  // Execution delay after voting period but before being able to execute a governance proposal
  executionDelay: number | null
}

export const initialState: State = {
  activeProposals: null,
  allProposals: {},
  resolvedProposals: null,
  votingPeriod: null,
  executionDelay: null
}

type SetActiveProposals = {
  proposals: Proposal[]
}

type SetAllProposals = {
  proposals: Proposal[]
}

type SetProposal = {
  proposal: Proposal
}

type SetVotingPeriod = {
  votingPeriod: number
}

type SetExecutionDelay = {
  executionDelay: number
}

const slice = createSlice({
  name: 'proposals',
  initialState,
  reducers: {
    setActiveProposals: (state, action: PayloadAction<SetActiveProposals>) => {
      state.activeProposals = action.payload.proposals
    },
    setAllProposals: (state, action: PayloadAction<SetAllProposals>) => {
      const { proposals } = action.payload
      const allProposals = proposals.reduce((acc, p) => {
        acc[p.proposalId] = p
        return acc
      }, {} as { [key: number]: Proposal })
      const resolvedProposals = proposals
        .filter((p) => p.outcome !== Outcome.InProgress)
        .map((p) => p.proposalId)
        .reverse()

      state.allProposals = allProposals
      state.resolvedProposals = resolvedProposals
    },
    setProposal: (state, action: PayloadAction<SetProposal>) => {
      const { proposal } = action.payload
      state.allProposals[proposal.proposalId] = proposal
    },
    setVotingPeriod: (state, action: PayloadAction<SetVotingPeriod>) => {
      const { votingPeriod } = action.payload
      state.votingPeriod = votingPeriod
    },
    setExecutionDelay: (state, action: PayloadAction<SetExecutionDelay>) => {
      const { executionDelay } = action.payload
      state.executionDelay = executionDelay
    }
  }
})

export const {
  setActiveProposals,
  setAllProposals,
  setProposal,
  setVotingPeriod,
  setExecutionDelay
} = slice.actions

export default slice.reducer
