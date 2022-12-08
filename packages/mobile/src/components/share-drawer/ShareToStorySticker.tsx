import type { Track, User } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { Image, View } from 'react-native'

import AudiusLogo from 'app/assets/images/audiusLogoHorizontal.svg'
import { Divider, Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useTrackImage } from '../image/TrackImage'

const messages = {
  by: 'by',
  nowPlayingOn: 'Now playing on'
}

type ShareToStoryStickerProps = {
  track: Pick<
    Track,
    'cover_art_sizes' | 'cover_art' | 'owner_id' | 'title' | 'track_id'
  >
  user?: Pick<User, 'creator_node_endpoint'>
  artist: Pick<User, 'user_id' | 'name' | 'is_verified'>
  style?: StyleProp<ViewStyle>
  /** Called once the image loads successfully */
  onLoad: () => void
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    width: 264,
    backgroundColor: palette.staticWhite,
    paddingTop: spacing(4),
    paddingBottom: spacing(4.5),
    paddingHorizontal: spacing(3),
    borderRadius: 8
  },
  infoContainer: {
    marginBottom: spacing(2),
    flexDirection: 'row',
    alignItems: 'center'
  },
  belowDividerContainer: {
    marginTop: spacing(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    marginTop: spacing(2)
  },
  subtitle: {
    flexGrow: 0
  },
  badges: {
    flexShrink: 0
  },
  attribution: {
    letterSpacing: 0.6
  }
}))

export const ShareToStorySticker = ({
  track,
  user,
  artist,
  style,
  onLoad
}: ShareToStoryStickerProps) => {
  const styles = useStyles()

  const trackImage = useTrackImage(track, user)
  const { neutralLight2 } = useThemeColors()
  return (
    <View style={[styles.container, style]}>
      <View>
        {trackImage ? (
          <Image
            onLoad={onLoad}
            height={240}
            width={240}
            source={trackImage.source}
            onError={trackImage.handleError}
            borderRadius={4}
          />
        ) : null}
        <Text
          color='staticNeutral'
          allowFontScaling={false}
          variant='h2'
          numberOfLines={1}
          style={styles.title}
        >
          {track.title}
        </Text>
        <View style={styles.infoContainer}>
          <Text
            allowFontScaling={false}
            color='staticNeutral'
            weight='medium'
            fontSize='medium'
            noGutter
            numberOfLines={1}
            style={styles.subtitle}
          >
            {messages.by} {artist.name}
          </Text>
          <UserBadges
            user={artist}
            badgeSize={12}
            style={styles.badges}
            hideName
          />
        </View>
        <Divider color='staticNeutralLight8' width={2} />
        <View style={styles.belowDividerContainer}>
          <Text
            allowFontScaling={false}
            color='staticNeutralLight2'
            weight='bold'
            fontSize='xs'
            textTransform='uppercase'
            style={styles.attribution}
          >
            {messages.nowPlayingOn}
          </Text>
          <AudiusLogo fill={neutralLight2} height={22} width={105} />
        </View>
      </View>
    </View>
  )
}
