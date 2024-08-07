import type { ArtistPickProps } from '@audius/harmony/src/components/comments/ArtistPick/types'

import { IconHeart, IconPin } from '@audius/harmony-native'

import { IconText } from '../IconText'

const pinIcon = { icon: IconPin }
const heartIcon = { icon: IconHeart, color: 'active' }

export const ArtistPick = ({ type }: ArtistPickProps) => {
  const isPicked = type === 'picked' || type === 'both'
  const isLiked = type === 'liked' || type === 'both'

  return (
    <IconText
      icons={[...(isPicked ? [pinIcon] : []), ...(isLiked ? [heartIcon] : [])]}
      text={`${isLiked ? 'Liked' : 'Picked'} by Artist`}
    />
  )
}
