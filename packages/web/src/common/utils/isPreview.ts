import { ID, Track } from '@audius/common/models'

export const isPreview = (
  track: Track,
  currentUserId: ID | null | undefined
) => {
  return !!track.preview_cid && track.owner_id !== currentUserId
}
