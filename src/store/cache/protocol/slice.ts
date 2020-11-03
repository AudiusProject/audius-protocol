import BN from 'bn.js'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
    minDelgationAmount?: BN
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
  minDelgationAmount: BN
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
      state.delegator.minDelgationAmount = action.payload.minDelgationAmount
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
