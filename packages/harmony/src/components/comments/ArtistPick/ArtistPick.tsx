import { IconHeart, IconPin } from 'icons'

import { IconText } from '../IconText'

import { ArtistPickProps } from './types'

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
