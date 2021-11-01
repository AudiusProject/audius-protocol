import { CommonState } from 'common/store'

export const getCollectible = (state: CommonState) => {
  return state.ui.collectibleDetails.collectible
}
