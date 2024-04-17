import {
  DogEarType,
  ID,
  SquareSizes,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import { Divider, Flex, Paper, Text } from '@audius/harmony'
import IconHeart from '@audius/harmony/src/assets/icons/Heart.svg'
import IconRepost from '@audius/harmony/src/assets/icons/Repost.svg'
import { Link, useLinkClickHandler } from 'react-router-dom-v5-compat'

import { DogEar } from 'components/dog-ear'
import { UserLink } from 'components/link'
import { LockedStatusBadge } from 'components/track/LockedStatusBadge'
import { useSelector } from 'utils/reducer'

import { CollectionImage } from './CollectionImage'
const { getCollection } = cacheCollectionsSelectors

const messages = {
  repost: 'Reposts',
  favorites: 'Favorites',
  hidden: 'Hidden'
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

const cardSizes = {
  s: 200,
  m: 224,
  l: 320
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
    save_count,
    is_private,
    access,
    stream_conditions
  } = collection

  const isPurchase = isContentUSDCPurchaseGated(stream_conditions)

  const dogEarType = is_private
    ? DogEarType.HIDDEN
    : isPurchase && !access.stream
    ? DogEarType.USDC_PURCHASE
    : null

  return (
    <Paper
      role='button'
      tabIndex={0}
      onClick={handleClick}
      aria-labelledby={`${id}-title ${id}-artist ${id}-repost ${id}-favorite ${id}-condition`}
      direction='column'
      border='default'
      w={cardSizes[size]}
      css={{ cursor: 'pointer' }}
    >
      {dogEarType ? (
        <DogEar
          type={dogEarType}
          css={{ position: 'absolute', top: -1, left: -1 }}
        />
      ) : null}
      <Flex direction='column' p='s' gap='s'>
        <CollectionImage
          collectionId={id}
          size={cardSizeToCoverArtSizeMap[size]}
          data-testid={`${id}-cover-art`}
        />
        <Link
          id={`${id}-title`}
          to={permalink}
          css={{
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <Text
            variant='title'
            tag='span'
            color='default'
            textAlign='center'
            ellipses
          >
            {playlist_name}
          </Text>
        </Link>
        <UserLink
          id={`${id}-artist`}
          userId={playlist_owner_id}
          textVariant='body'
          css={{ alignSelf: 'center' }}
        />
      </Flex>
      <Divider orientation='horizontal' />
      <Flex gap='l' p='s' justifyContent='center' backgroundColor='surface1'>
        {is_private ? (
          <Text
            variant='body'
            size='s'
            strength='strong'
            color='subdued'
            id={`${id}-condition`}
          >
            {messages.hidden}
          </Text>
        ) : (
          <>
            <Flex gap='xs' alignItems='center' id={`${id}-repost`}>
              <IconRepost size='s' color='subdued' title={messages.repost} />
              <Text variant='label' color='subdued'>
                {repost_count}
              </Text>
            </Flex>
            <Flex gap='xs' alignItems='center' id={`${id}-favorite`}>
              <IconHeart size='s' color='subdued' title={messages.favorites} />
              <Text variant='label' color='subdued'>
                {save_count}
              </Text>
            </Flex>
            {isPurchase ? (
              <LockedStatusBadge
                variant='premium'
                locked={!access.stream}
                id={`${id}-condition`}
              />
            ) : null}
          </>
        )}
      </Flex>
    </Paper>
  )
}
