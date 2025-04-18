import { IconHeart, IconPin, IconText } from '@audius/harmony'

const pinIcon = { icon: IconPin }
const heartIcon = { icon: IconHeart, color: 'active' }

type ArtistPickProps = {
  isPinned?: boolean
  isLiked?: boolean
}

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
