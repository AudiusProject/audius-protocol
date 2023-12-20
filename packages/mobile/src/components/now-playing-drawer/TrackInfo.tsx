import {
  useGatedContentAccess,
  type Nullable,
  type Track,
  type User,
  playerSelectors
} from '@audius/common'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import { LockedStatusBadge, Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

const { getPreviewing } = playerSelectors

const messages = {
  preview: 'PREVIEW'
}

const useStyles = makeStyles(({ typography, spacing }) => ({
  root: {
    alignItems: 'center'
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing(2),
    flexWrap: 'wrap'
  },
  previewBadge: {
    marginBottom: spacing(2)
  },
  trackTitle: {
    textAlign: 'center'
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3)
  },
  artist: {
    marginBottom: 0,
    fontFamily: typography.fontByWeight.medium
  }
}))

type TrackInfoProps = {
  track: Nullable<Track>
  user: Nullable<User>
  onPressArtist: GestureResponderHandler
  onPressTitle: GestureResponderHandler
}

export const TrackInfo = ({
  onPressArtist,
  onPressTitle,
  track,
  user
}: TrackInfoProps) => {
  const styles = useStyles()
  const { doesUserHaveAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPreviewLock =
    track?.stream_conditions &&
    'usdc_purchase' in track.stream_conditions &&
    (!doesUserHaveAccess || isPreviewing)

  return (
    <View style={styles.root}>
      {user && track ? (
        <>
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={onPressTitle}
          >
            <Text numberOfLines={2} style={styles.trackTitle} variant='h1'>
              {track.title}
            </Text>
            {shouldShowPreviewLock ? (
              <View style={styles.previewBadge}>
                <LockedStatusBadge
                  variant='purchase'
                  locked
                  coloredWhenLocked
                  iconSize='small'
                  text={messages.preview}
                />
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressArtist}>
            <View style={styles.artistInfo}>
              <Text
                numberOfLines={1}
                style={styles.artist}
                variant='h1'
                color='secondary'
              >
                {user.name}
              </Text>
              <UserBadges user={user} badgeSize={12} hideName />
            </View>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  )
}
