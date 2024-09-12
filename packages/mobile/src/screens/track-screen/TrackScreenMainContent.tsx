import type { ReactNode } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import type {
  LineupState,
  SearchUser,
  SearchTrack,
  Track,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { Nullable } from '@audius/common/utils'

import { Flex } from '@audius/harmony-native'
import { CommentSection } from 'app/components/comments/CommentSection'
import { useIsScreenReady } from 'app/hooks/useIsScreenReady'
import { useNavigation } from 'app/hooks/useNavigation'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenRemixes } from './TrackScreenRemixes'

type TrackScreenMainContentProps = {
  lineup: LineupState<Track>
  lineupHeader: ReactNode
  remixParentTrack: Nullable<Track & { user: User }>
  track: Track | SearchTrack
  user: User | SearchUser
}

/**
 * `TrackScreenMainContent` includes everything above the Lineup
 */
export const TrackScreenMainContent = ({
  lineup,
  lineupHeader,
  track,
  user
}: TrackScreenMainContentProps) => {
  const navigation = useNavigation()
  const isReady = useIsScreenReady()
  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const {
    track_id,
    _remixes,
    field_visibility,
    _remixes_count,
    comments_disabled
  } = track

  const remixTrackIds = _remixes?.map(({ track_id }) => track_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push('TrackRemixes', { id: track_id })
  }
  return (
    <Flex p='m' pb={0}>
      <Flex gap='2xl'>
        <TrackScreenDetailsTile
          track={track}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />

        {isReady ? (
          <>
            {field_visibility?.remixes &&
              remixTrackIds &&
              remixTrackIds.length > 0 && (
                <TrackScreenRemixes
                  trackIds={remixTrackIds}
                  onPressGoToRemixes={handlePressGoToRemixes}
                  count={_remixes_count ?? null}
                />
              )}

            {isCommentingEnabled && !comments_disabled ? (
              <Flex flex={3}>
                <CommentSection entityId={track_id} />
              </Flex>
            ) : null}
            {lineupHeader}
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}
