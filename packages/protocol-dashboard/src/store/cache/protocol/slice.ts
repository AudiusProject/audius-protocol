import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

type ServiceInfo = {
  isValid: boolean
  minStake: BN
  maxStake: BN
}

export type State = {
  totalStaked?: BN
  ethBlockNumber?: number
  // Average block processing time
  averageBlockTime?: number
  delegator: {
    minDelegationAmount?: BN
    maxDelegators?: number
  }
  services: {
    discoveryProvider?: ServiceInfo
    contentNode?: ServiceInfo
  }
}

export const initialState: State = {
  delegator: {},
  services: {}
}

type SetTotalStaked = BN
type SetDelegator = {
  minDelegationAmount: BN
  maxDelegators: number
}

type SetServiceTypeInfo = {
  contentNode: ServiceInfo
  discoveryProvider: ServiceInfo
}

const slice = createSlice({
  name: 'protocol',
  initialState,
  reducers: {
    setTotalStaked: (state, action: PayloadAction<SetTotalStaked>) => {
      state.totalStaked = action.payload
    },
    setDelgator: (state, action: PayloadAction<SetDelegator>) => {
      state.delegator.minDelegationAmount = action.payload.minDelegationAmount
      state.delegator.maxDelegators = action.payload.maxDelegators
    },
    setServiceTypeInfo: (state, action: PayloadAction<SetServiceTypeInfo>) => {
      state.services.discoveryProvider = action.payload.discoveryProvider
      state.services.contentNode = action.payload.contentNode
    },
    setEthBlockNumber: (state, action: PayloadAction<number>) => {
      state.ethBlockNumber = action.payload
    },
    setAverageBlockTime: (state, action: PayloadAction<number>) => {
      state.averageBlockTime = action.payload
    }
  }
})

export const {
  setDelgator,
  setTotalStaked,
  setServiceTypeInfo,
  setEthBlockNumber,
  setAverageBlockTime
} = slice.actions

export default slice.reducer
