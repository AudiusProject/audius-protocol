import { ID, Track } from '@audius/common/models'
import {} from '@audius/common'

export const isPreview = (track: Track, currentUserId: ID | null) => {
  return !!track.preview_cid && track.owner_id !== currentUserId
}
