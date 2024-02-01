import { CommonState } from '~/store/commonStore'

export const getFeePayer = (state: CommonState) => state.solana.feePayer
