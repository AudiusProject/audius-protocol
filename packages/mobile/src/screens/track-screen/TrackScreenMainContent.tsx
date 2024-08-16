import type { ReactNode } from 'react'

import { CommentSectionProvider } from '@audius/common/context'
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
import { View } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { CommentSection } from 'app/components/comments/CommentSection'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenRemixes } from './TrackScreenRemixes'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3),
    paddingBottom: 0
  }
}))

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
  const styles = useStyles()
  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const remixTrackIds = track._remixes?.map(({ track_id }) => track_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push('TrackRemixes', { id: track.track_id })
  }
  return (
    <View style={styles.root}>
      <Flex gap='2xl'>
        <TrackScreenDetailsTile
          track={track}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />

        {track.field_visibility?.remixes &&
          remixTrackIds &&
          remixTrackIds.length > 0 && (
            <TrackScreenRemixes
              trackIds={remixTrackIds}
              onPressGoToRemixes={handlePressGoToRemixes}
              count={track._remixes_count ?? null}
            />
          )}

        {isCommentingEnabled ? (
          <Flex flex={3}>
            <CommentSectionProvider
              artistId={track.owner_id}
              userId={user.user_id}
              entityId={track.track_id}
              isEntityOwner={user.user_id === track.owner_id}
              playTrack={() => {}} // TODO
            >
              <CommentSection />
            </CommentSectionProvider>
          </Flex>
        ) : null}
        {lineupHeader}
      </Flex>
    </View>
  )
}
