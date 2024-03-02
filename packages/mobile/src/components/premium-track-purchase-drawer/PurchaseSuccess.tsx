import { useCallback } from 'react'

import type { PurchaseableTrackMetadata } from '@audius/common/hooks'
import { tracksSocialActions } from '@audius/common/store'
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
import { getTrackRoute } from 'app/utils/routes'

import { TwitterButton } from '../twitter-button'

const messages = {
  success: 'Your Purchase Was Successful!',
  shareTwitterTextTrack: (trackTitle: string, handle: string) =>
    `I bought the track ${trackTitle} by ${handle} on @Audius! #AudiusPremium`,
  shareTwitterTextStems: (trackTitle: string, handle: string) =>
    `I bought the stems for ${trackTitle} by ${handle} on @Audius! #AudiusPremium`,
  viewTrack: 'View Track',
  repost: 'Repost',
  reposted: 'Reposted'
}

export const PurchaseSuccess = ({
  onPressViewTrack,
  track
}: {
  onPressViewTrack: () => void
  track: PurchaseableTrackMetadata
}) => {
  const { handle } = track.user
  const {
    title,
    is_download_gated,
    _stems,
    has_current_user_reposted: isReposted,
    track_id: trackId
  } = track

  const link = getTrackRoute(track, true)

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (handle: string) => {
      let shareText: string
      if (is_download_gated && _stems?.length) {
        shareText = messages.shareTwitterTextStems(title, handle)
      } else {
        shareText = messages.shareTwitterTextTrack(title, handle)
      }
      return {
        shareText,
        analytics: {
          eventName: EventNames.PURCHASE_CONTENT_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [title, is_download_gated, _stems]
  )

  const onRepost = useCallback(() => {
    dispatch(
      isReposted
        ? tracksSocialActions.undoRepostTrack(trackId, RepostSource.PURCHASE)
        : tracksSocialActions.repostTrack(trackId, RepostSource.PURCHASE)
    )
  }, [dispatch, isReposted, trackId])

  return (
    <Flex pt='unitHalf' gap='2xl' alignSelf='center'>
      <Flex direction='row' justifyContent='center' alignItems='center' gap='s'>
        <IconValidationCheck height={spacing(4)} width={spacing(4)} />
        <Text variant='heading' size='s'>
          {messages.success}
        </Text>
      </Flex>
      <Flex gap='l'>
        <Button onPress={onRepost} iconLeft={IconRepost} isActive={isReposted}>
          {isReposted ? messages.reposted : messages.repost}
        </Button>
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
