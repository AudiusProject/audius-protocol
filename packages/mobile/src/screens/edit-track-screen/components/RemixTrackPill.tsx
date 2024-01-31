import type { Track, User } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { Pill, Text } from 'app/components/core'
import { TrackImage } from 'app/components/image/TrackImage'
import UserBadges from 'app/components/user-badges'
import { makeStyles } from 'app/styles'

const messages = {
  trackBy: 'By'
}

type RemixTrackPillProps = {
  track: Track
  user: User
  style?: StyleProp<ViewStyle>
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  trackPill: {
    marginTop: spacing(4)
  },
  trackArtwork: {
    height: spacing(5) + 2,
    width: spacing(5) + 2,
    marginRight: spacing(1),
    borderWidth: 1,
    borderRadius: 2,
    overflow: 'hidden',
    borderColor: palette.neutralLight9
  },
  trackTextContainer: {
    flex: 1
  },
  trackText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold
  },
  byText: {
    color: palette.neutralLight2
  }
}))

export const RemixTrackPill = (props: RemixTrackPillProps) => {
  const { track, user, style } = props
  const styles = useStyles()

  return (
    <Pill style={[styles.trackPill, style]}>
      <TrackImage
        track={track}
        size={SquareSizes.SIZE_150_BY_150}
        style={styles.trackArtwork}
      />
      <View style={styles.trackTextContainer}>
        <Text style={styles.trackText} numberOfLines={1} ellipsizeMode='middle'>
          {track.title}{' '}
          <Text style={[styles.trackText, styles.byText]}>
            {messages.trackBy}{' '}
          </Text>
          <Text style={styles.trackText}>{user.name} </Text>
        </Text>
      </View>
      <UserBadges user={user} hideName />
    </Pill>
  )
}
