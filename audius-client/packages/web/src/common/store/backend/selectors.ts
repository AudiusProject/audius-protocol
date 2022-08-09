import { CommonState } from '../reducers'

export const getWeb3Error = (state: CommonState) => state.backend.web3Error
