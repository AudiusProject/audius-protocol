import { MouseEvent, Ref, forwardRef, useCallback } from 'react'

import {
  useCollection,
  useCurrentUserId,
  useRemixContest,
  useTrack,
  useUser
} from '@audius/common/api'
import {
  ID,
  SquareSizes,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import {
  formatCount,
  formatDate,
  formatReleaseDate
} from '@audius/common/utils'
import { Flex, Skeleton, Text } from '@audius/harmony'
import IconHeart from '@audius/harmony/src/assets/icons/Heart.svg'
import IconRepost from '@audius/harmony/src/assets/icons/Repost.svg'
import { pick } from 'lodash'
import { useLinkClickHandler } from 'react-router-dom-v5-compat'

import { Card, CardProps, CardFooter, CardContent } from 'components/card'
import { TextLink, UserLink } from 'components/link'
import { LockedStatusBadge } from 'components/locked-status-badge'
import { TrackArtwork } from 'components/track/TrackArtwork'

// import { CollectionDogEar } from './CollectionDogEar'
// import { CollectionImage } from './CollectionImage'

const messages = {
  repost: 'Reposts',
  favorites: 'Favorites',
  hidden: 'Hidden',
  deadline: (releaseDate?: string) =>
    `Deadline ${releaseDate ? (new Date(releaseDate) < new Date() ? formatDate(releaseDate) : 'Ended') : releaseDate}`
}

type RemixContestCardProps = Omit<CardProps, 'id'> & {
  id: ID
  loading?: boolean
  noNavigation?: boolean
  onCollectionLinkClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

const cardSizeToCoverArtSizeMap = {
  xs: SquareSizes.SIZE_150_BY_150,
  s: SquareSizes.SIZE_480_BY_480,
  m: SquareSizes.SIZE_480_BY_480,
  l: SquareSizes.SIZE_480_BY_480
}

export const RemixContestCard = forwardRef(
  (props: RemixContestCardProps, ref: Ref<HTMLDivElement>) => {
    const {
      id,
      loading,
      size,
      onClick,
      onCollectionLinkClick,
      noNavigation,
      ...other
    } = props
    console.log('asdf props: ', props)
    const { data: currentUserId } = useCurrentUserId()
    const { data: remixContest, isPending: isRemixContestPending } =
      useRemixContest(id)
    const { data: track, isPending: isTrackPending } = useTrack(
      remixContest?.entityId
    )
    const { data: user, isPending: isUserPending } = useUser(track?.owner_id)

    const isPending =
      isRemixContestPending || isTrackPending || isUserPending || !track
    console.log('asdf remixContest: ', remixContest)
    console.log('asdf track: ', track)
    const permalink = track?.permalink

    const handleNavigate = useLinkClickHandler<HTMLDivElement>(permalink ?? '')

    const handleClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        onClick?.(e)
        if (noNavigation) return
        handleNavigate(e)
      },
      [noNavigation, handleNavigate, onClick]
    )

    if (isPending || loading) {
      return (
        <Card size={size} {...other}>
          <Flex direction='column' p='s' gap='s'>
            <Skeleton border='default' css={{ aspectRatio: 1 }} />
            <CardContent gap='xs'>
              <Skeleton h={24} w='80%' alignSelf='center' />
              <Skeleton h={20} w='50%' alignSelf='center' />
            </CardContent>
          </Flex>
          <CardFooter>
            <Skeleton h={16} w='60%' alignSelf='center' />
          </CardFooter>
        </Card>
      )
    }

    return (
      <Card ref={ref} onClick={handleClick} size={size} {...other}>
        {/* <CollectionDogEar collectionId={id} /> */}
        <Flex direction='column' p='s' gap='s'>
          <TrackArtwork
            trackId={track.track_id}
            size={SquareSizes.SIZE_150_BY_150}
            mr='xs'
            css={{ minHeight: 24, minWidth: 24 }}
          />
          <CardContent gap='xs'>
            <TextLink
              to={permalink}
              textVariant='title'
              css={{ justifyContent: 'center' }}
              onClick={onCollectionLinkClick}
            >
              <Text ellipses>{track?.title}</Text>
            </TextLink>
            <Flex justifyContent='center'>
              <UserLink userId={user?.user_id} popover center />
            </Flex>
          </CardContent>
        </Flex>
        <CardFooter>
          <Text>{messages.deadline(remixContest?.endDate)} </Text>
        </CardFooter>
      </Card>
    )
  }
)
