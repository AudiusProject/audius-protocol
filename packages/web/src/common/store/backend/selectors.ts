// TODO: change back to CommonState
import { AppState } from 'store/types'

export const getWeb3Error = (state: AppState) => state.backend.web3Error
