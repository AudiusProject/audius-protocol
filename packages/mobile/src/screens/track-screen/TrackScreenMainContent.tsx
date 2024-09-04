import { useEffect, type ReactNode } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import type {
  LineupState,
  SearchUser,
  SearchTrack,
  Track,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  lineupSelectors,
  reachabilitySelectors,
  remixesPageActions,
  remixesPageSelectors,
  remixesPageLineupActions as tracksActions
} from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { CommentSection } from 'app/components/comments/CommentSection'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'

const { fetchTrack, reset } = remixesPageActions
const { getLineup } = remixesPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getRemixesTracksLineup = makeGetLineupMetadatas(getLineup)
const { getIsReachable } = reachabilitySelectors

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
  const dispatch = useDispatch()
  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const remixesLineup = useSelector(getRemixesTracksLineup)
  const isReachable = useSelector(getIsReachable)

  const {
    track_id,
    _remixes,
    field_visibility,
    _remixes_count,
    comments_disabled
  } = track

  const remixTrackIds = _remixes?.map(({ track_id }) => track_id) ?? null

  useEffect(() => {
    dispatch(
      tracksActions.fetchLineupMetadatas(0, 10, false, {
        trackId: track.track_id
      })
    )

    return function cleanup() {
      dispatch(reset())
      dispatch(tracksActions.reset())
    }
  }, [dispatch, track])

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

        {isCommentingEnabled && !comments_disabled ? (
          <Flex flex={3}>
            <CommentSection entityId={track_id} />
          </Flex>
        ) : null}

        {field_visibility?.remixes &&
          remixTrackIds &&
          remixTrackIds.length > 0 && (
            <Lineup
              lineup={remixesLineup}
              actions={tracksActions}
              count={isReachable ? 6 : 0}
            />
          )}

        {lineupHeader}
      </Flex>
    </Flex>
  )
}
