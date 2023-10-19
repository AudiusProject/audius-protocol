import {
  usePremiumContentAccess,
  type Nullable,
  type Track,
  type User
} from '@audius/common'
import { TouchableOpacity, View } from 'react-native'

import { LockedStatusBadge, Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

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
    gap: spacing(2),
    flexWrap: 'wrap'
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
  const { doesUserHaveAccess } = usePremiumContentAccess(track)
  const shouldShowPreviewLock =
    track?.premium_conditions &&
    'usdc_purchase' in track.premium_conditions &&
    !doesUserHaveAccess

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
              <LockedStatusBadge
                variant='purchase'
                locked
                coloredWhenLocked
                iconSize='small'
                text={messages.preview}
              />
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
