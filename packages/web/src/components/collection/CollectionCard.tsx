import { ID, SquareSizes } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import {
  Divider,
  Flex,
  // IconHeart,
  // IconRepost,
  Paper,
  Text
} from '@audius/harmony'
import IconHeart from '@audius/harmony/src/assets/icons/Heart.svg'
import IconRepost from '@audius/harmony/src/assets/icons/Repost.svg'
import { Link, useLinkClickHandler } from 'react-router-dom-v5-compat'

import { UserLink } from 'components/link'
import { useSelector } from 'utils/reducer'

import { CollectionImage } from './CollectionImage'
const { getCollection } = cacheCollectionsSelectors

const messages = {
  repost: 'Reposts',
  favorites: 'Favorites'
}

type CardSize = 's' | 'm' | 'l'

type CollectionCardProps = {
  id: ID
  size: CardSize
}

const cardSizeToCoverArtSizeMap = {
  s: SquareSizes.SIZE_150_BY_150,
  m: SquareSizes.SIZE_480_BY_480,
  l: SquareSizes.SIZE_480_BY_480
}

export const CollectionCard = (props: CollectionCardProps) => {
  const { id, size } = props

  const collection = useSelector((state) => getCollection(state, { id }))

  const handleClick = useLinkClickHandler<HTMLDivElement>(
    collection?.permalink ?? ''
  )

  if (!collection) return null

  const {
    playlist_name,
    permalink,
    playlist_owner_id,
    repost_count,
    save_count
  } = collection

  return (
    <Paper
      role='button'
      tabIndex={0}
      onClick={handleClick}
      aria-labelledby={`${id}-title ${id}-artist`}
      direction='column'
      css={{ cursor: 'pointer' }}
    >
      <CollectionImage
        id={id}
        size={cardSizeToCoverArtSizeMap[size]}
        data-testid={`${id}-cover-art`}
      />
      <Link id={`${id}-title`} to={permalink}>
        <Text variant='title' tag='span' color='default'>
          {playlist_name}
        </Text>
      </Link>
      <UserLink id={`${id}-artist`} userId={playlist_owner_id} />
      <Divider orientation='horizontal' />
      <Flex gap='l'>
        <Text color='subdued' variant='body' size='s'>
          <IconRepost size='s' title={messages.repost} /> {repost_count}
        </Text>
        <Text color='subdued' variant='body' size='s'>
          <IconHeart size='s' title={messages.favorites} /> {save_count}
        </Text>
      </Flex>
    </Paper>
  )
}
