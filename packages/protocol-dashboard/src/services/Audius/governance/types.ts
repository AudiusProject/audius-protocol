import { Proposal, VoteEvent } from 'types'

/**
 * Raw unformatted Proposal returned over the wire.
 */
export type RawProposal = Omit<Proposal, 'outcome'> & {
  outcome: number
}

/**
 * Raw unformatted VoteEvent returned over the wire.
 */
export type RawVoteEvent = Omit<VoteEvent, 'vote'> & {
  vote: 1 | 2
}
