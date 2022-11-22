import type { Track, User } from '@audius/common'
import { SquareSizes } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { DynamicImage, Pill, Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
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
  trackText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold,
    marginTop: spacing(1)
  },
  byText: {
    color: palette.neutralLight2
  }
}))

export const RemixTrackPill = (props: RemixTrackPillProps) => {
  const { track, user, style } = props
  const styles = useStyles()

  const trackCoverArt = useTrackCoverArt({
    id: track?.track_id,
    sizes: track?._cover_art_sizes ?? null,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <Pill style={[styles.trackPill, style]}>
      <DynamicImage uri={trackCoverArt} style={styles.trackArtwork} />
      <Text style={styles.trackText}>
        {track.title}{' '}
        <Text style={[styles.trackText, styles.byText]}>
          {messages.trackBy}
        </Text>{' '}
        {user.name}
      </Text>
      <UserBadges user={user} hideName />
    </Pill>
  )
}
