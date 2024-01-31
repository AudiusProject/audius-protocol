import { CommonState } from '~/store/commonStore'

export const getCollectibleDetails = (state: CommonState) => {
  return state.ui.collectibleDetails
}

export const getCollectible = (state: CommonState) => {
  return state.ui.collectibleDetails.collectible
}

export const getCollectibleOwnerId = (state: CommonState) => {
  return state.ui.collectibleDetails.ownerId
}

export const getCollectibleOwnerHandle = (state: CommonState) => {
  return state.ui.collectibleDetails.ownerHandle
}

export const getCollectibleEmbedHash = (state: CommonState) => {
  return state.ui.collectibleDetails.embedCollectibleHash
}
