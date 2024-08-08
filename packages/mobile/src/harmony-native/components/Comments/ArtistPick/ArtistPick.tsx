import type { ArtistPickProps } from '@audius/harmony/src/components/comments/ArtistPick/types'

import { IconHeart, IconPin } from '@audius/harmony-native'

import { IconText } from '../IconText'

const pinIcon = { icon: IconPin }
const heartIcon = { icon: IconHeart, color: 'active' }

export const ArtistPick = ({
  isPinned = false,
  isLiked = false
}: ArtistPickProps) => {
  if (!isPinned && !isLiked) return null

  const text = `${isLiked ? 'Liked' : 'Pinned'} by Artist`

  return (
    <IconText
      icons={[...(isPinned ? [pinIcon] : []), ...(isLiked ? [heartIcon] : [])]}
    >
      {text}
    </IconText>
  )
}
