import { getEntry } from '~/store/cache/selectors'
import { CommonState } from '~/store/commonStore'

import { Kind, ID, UID } from '../../../models'

/** @deprecated Use useTrack instead */
export const getTrack = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null; permalink?: string | null }
) => {
  if (
    props.permalink &&
    state.tracks.permalinks[props.permalink.toLowerCase()]
  ) {
    props.id = state.tracks.permalinks[props.permalink.toLowerCase()]
  }
  return getEntry(state, {
    ...props,
    kind: Kind.TRACKS
  })
}
