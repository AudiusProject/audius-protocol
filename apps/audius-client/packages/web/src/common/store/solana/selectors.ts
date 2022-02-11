import { CommonState } from 'common/store'

export const getFeePayer = (state: CommonState) => state.solana.feePayer
