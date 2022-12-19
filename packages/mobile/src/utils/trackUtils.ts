import type { Track } from '@audius/common'

export const isAvailableForPlay = (
  track: Pick<
    Track,
    'is_available' | 'is_delete' | 'is_invalid' | 'is_unlisted' | 'owner_id'
  >,
  currentUserId: number
) =>
  track.is_available &&
  !track.is_delete &&
  !track.is_invalid &&
  !(track.is_unlisted && track.owner_id !== currentUserId)
