import { ID } from '../../models'
import { CommonState } from '../commonStore'

export const getUserCollectibles = (state: CommonState, props: { id: ID }) =>
  state.collectibles.userCollectibles[props.id]

export const getSolCollections = (state: CommonState) =>
  state.collectibles.solCollections
