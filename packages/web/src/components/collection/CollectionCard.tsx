import { MouseEvent, Ref, forwardRef, useCallback } from 'react'

import {
  DogEarType,
  ID,
  SquareSizes,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import IconHeart from '@audius/harmony/src/assets/icons/Heart.svg'
import IconRepost from '@audius/harmony/src/assets/icons/Repost.svg'
import { Link, useLinkClickHandler } from 'react-router-dom-v5-compat'

import { Card, CardProps, CardFooter } from 'components/card'
import { DogEar } from 'components/dog-ear'
import { UserLink } from 'components/link'
import { LockedStatusPill } from 'components/locked-status-pill'
import { useSelector } from 'utils/reducer'

import { CollectionImage } from './CollectionImage'

const { getCollection } = cacheCollectionsSelectors

const messages = {
  repost: 'Reposts',
  favorites: 'Favorites',
  hidden: 'Hidden'
}

type CollectionCardProps = Omit<CardProps, 'id'> & {
  id: ID
}

const cardSizeToCoverArtSizeMap = {
  s: SquareSizes.SIZE_150_BY_150,
  m: SquareSizes.SIZE_480_BY_480,
  l: SquareSizes.SIZE_480_BY_480
}

export const CollectionCard = forwardRef(
  (props: CollectionCardProps, ref: Ref<HTMLDivElement>) => {
    const { id, size, onClick, ...other } = props

    const collection = useSelector((state) => getCollection(state, { id }))

    const handleNavigate = useLinkClickHandler<HTMLDivElement>(
      collection?.permalink ?? ''
    )

    const handleClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        onClick?.(e)
        handleNavigate(e)
      },
      [handleNavigate, onClick]
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
      <Card ref={ref} onClick={handleClick} size={size} {...other}>
        {dogEarType ? (
          <DogEar type={dogEarType} css={{ top: -1, left: -1 }} />
        ) : null}
        <Flex direction='column' p='s' gap='s'>
          <CollectionImage
            collectionId={id}
            size={cardSizeToCoverArtSizeMap[size]}
            data-testid={`${id}-cover-art`}
          />
          <Flex direction='column' gap='xs'>
            <Text variant='title' color='default' ellipses asChild>
              <Link to={permalink} css={{ pointerEvents: 'none' }}>
                {playlist_name}
              </Link>
            </Text>
            <UserLink
              userId={playlist_owner_id}
              textVariant='body'
              css={{ justifyContent: 'center' }}
            />
          </Flex>
        </Flex>
        <CardFooter>
          {is_private ? (
            <Text variant='body' size='s' strength='strong' color='subdued'>
              {messages.hidden}
            </Text>
          ) : (
            <>
              <Flex gap='xs' alignItems='center'>
                <IconRepost size='s' color='subdued' title={messages.repost} />
                <Text variant='label' color='subdued'>
                  {repost_count}
                </Text>
              </Flex>
              <Flex gap='xs' alignItems='center'>
                <IconHeart
                  size='s'
                  color='subdued'
                  title={messages.favorites}
                />
                <Text variant='label' color='subdued'>
                  {save_count}
                </Text>
              </Flex>
              {isPurchase ? (
                <LockedStatusPill variant='premium' locked={!access.stream} />
              ) : null}
            </>
          )}
        </CardFooter>
      </Card>
    )
  }
)
