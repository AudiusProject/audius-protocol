import { IconHeart, IconPin } from 'icons'

import { IconText } from '../IconText'

import { ArtistPickProps } from './types'

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
