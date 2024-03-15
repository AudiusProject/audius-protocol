import { useCallback } from 'react'

import type { PurchaseableContentMetadata } from '@audius/common/hooks'
import {
  collectionsSocialActions,
  tracksSocialActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import {
  IconCaretRight,
  IconRepost,
  IconValidationCheck,
  Flex,
  Text,
  PlainButton,
  EntityActionButton
} from '@audius/harmony-native'
import { spacing } from 'app/styles/spacing'
import { EventNames, RepostSource } from 'app/types/analytics'
import { getCollectionRoute, getTrackRoute } from 'app/utils/routes'

import { TwitterButton } from '../twitter-button'

const messages = {
  success: 'Your Purchase Was Successful!',
  shareTwitterText: (contentType: string, trackTitle: string, handle: string) =>
    `I bought the ${contentType} ${trackTitle} by ${handle} on @Audius! #AudiusPremium`,
  viewTrack: 'View Track',
  repost: 'Repost',
  reposted: 'Reposted'
}

export const PurchaseSuccess = ({
  onPressViewTrack,
  metadata
}: {
  onPressViewTrack: () => void
  metadata: PurchaseableContentMetadata
}) => {
  const { handle } = metadata.user
  const { has_current_user_reposted: isReposted } = metadata
  const isAlbum = 'playlist_id' in metadata
  const title = isAlbum ? metadata.playlist_name : metadata.title
  const contentId = isAlbum ? metadata.playlist_id : metadata.track_id

  const link = isAlbum
    ? getCollectionRoute(metadata)
    : getTrackRoute(metadata, true)

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (handle: string) => {
      let shareText: string
      if (!isAlbum && metadata.is_download_gated && metadata._stems?.length) {
        shareText = messages.shareTwitterText('stems for', title, handle)
      } else {
        shareText = messages.shareTwitterText(
          isAlbum ? 'album' : 'track',
          title,
          handle
        )
      }
      return {
        shareText,
        analytics: {
          eventName: EventNames.PURCHASE_CONTENT_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [isAlbum, metadata, title]
  )

  const onRepost = useCallback(() => {
    dispatch(
      isReposted
        ? (isAlbum
            ? collectionsSocialActions.undoRepostCollection
            : tracksSocialActions.undoRepostTrack)(
            contentId,
            RepostSource.PURCHASE
          )
        : (isAlbum
            ? collectionsSocialActions.repostCollection
            : tracksSocialActions.repostTrack)(contentId, RepostSource.PURCHASE)
    )
  }, [contentId, dispatch, isAlbum, isReposted])

  return (
    <Flex pt='unitHalf' gap='2xl' alignSelf='center'>
      <Flex direction='row' justifyContent='center' alignItems='center' gap='s'>
        <IconValidationCheck height={spacing(4)} width={spacing(4)} />
        <Text variant='heading' size='s'>
          {messages.success}
        </Text>
      </Flex>
      <Flex gap='l'>
        <EntityActionButton
          onPress={onRepost}
          iconLeft={IconRepost}
          isActive={isReposted}
        >
          {isReposted ? messages.reposted : messages.repost}
        </EntityActionButton>
        <TwitterButton
          fullWidth
          type='dynamic'
          url={link}
          shareData={handleTwitterShare}
          handle={handle}
          size='large'
        />
      </Flex>
      <PlainButton
        size='large'
        variant='subdued'
        onPress={onPressViewTrack}
        iconRight={IconCaretRight}
      >
        {messages.viewTrack}
      </PlainButton>
    </Flex>
  )
}
