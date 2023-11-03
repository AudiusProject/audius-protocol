import { Track, accountSelectors } from '@audius/common'
import { select } from 'typed-redux-saga'

const { getUserId } = accountSelectors

export function* isPreview(track: Track) {
  const currentUserId = yield* select(getUserId)
  return !!track.preview_cid && track.owner_id !== currentUserId
}
