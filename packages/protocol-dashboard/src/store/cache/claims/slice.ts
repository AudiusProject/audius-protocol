import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

import { Status } from 'types'

export type State = {
  metadata: {
    fundsPerRound?: BN
    lastFundedBlock?: number
    totalClaimedInRound?: BN
    recurringCommunityFundingAmount?: BN
    fundingRoundBlockDiff?: number
  }
  users: {
    [wallet: string]: {
      status: Status
      hasClaim: boolean
    }
  }
}

export const initialState: State = {
  metadata: {},
  users: {}
}

type FetchClaim = { wallet: string }
type SetClaim = { wallet: string; hasClaim: boolean }
type SetClaimMetadata = {
  fundsPerRound: BN
  totalClaimedInRound: BN
  lastFundedBlock: number
  fundingRoundBlockDiff: number
  recurringCommunityFundingAmount?: BN
}

const slice = createSlice({
  name: 'claim',
  initialState,
  reducers: {
    fetchClaim: (state, action: PayloadAction<FetchClaim>) => {
      state.users[action.payload.wallet] = {
        status: Status.Loading,
        hasClaim: false
      }
    },
    setClaim: (state, action: PayloadAction<SetClaim>) => {
      state.users[action.payload.wallet] = {
        status: Status.Success,
        hasClaim: action.payload.hasClaim
      }
    },
    setClaimMetadata: (state, action: PayloadAction<SetClaimMetadata>) => {
      state.metadata.fundsPerRound = action.payload.fundsPerRound
      state.metadata.lastFundedBlock = action.payload.lastFundedBlock
      state.metadata.fundingRoundBlockDiff =
        action.payload.fundingRoundBlockDiff
      state.metadata.totalClaimedInRound = action.payload.totalClaimedInRound
    }
  }
})

export const { fetchClaim, setClaim, setClaimMetadata } = slice.actions

export default slice.reducer
