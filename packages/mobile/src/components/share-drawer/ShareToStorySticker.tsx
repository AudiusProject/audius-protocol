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
  track: Pick<Track, 'cover_art_sizes' | 'cover_art' | 'owner_id' | 'title'>
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

  const { source: trackImage, handleError: handleTrackImageError } =
    useTrackImage(track, user)
  const { neutralLight2 } = useThemeColors()
  return (
    <View style={[styles.container, style]}>
      <View>
        <Image
          onLoad={onLoad}
          height={240}
          width={240}
          source={trackImage}
          onError={handleTrackImageError}
          borderRadius={4}
        />
        <Text variant='h2' numberOfLines={1} style={{ marginTop: 8 }}>
          {track.title}
        </Text>
        <View style={styles.infoContainer}>
          <Text
            weight='medium'
            fontSize='medium'
            noGutter
            numberOfLines={1}
            style={{ flexGrow: 0 }}
          >
            {messages.by} {artist.name}
          </Text>
          <UserBadges
            user={artist}
            badgeSize={12}
            style={{ flexShrink: 0 }}
            hideName
          />
        </View>
        <Divider style={{ borderBottomWidth: 2 }} />
        <View style={styles.belowDividerContainer}>
          <Text
            color='neutralLight2'
            weight='bold'
            fontSize='xs'
            textTransform='uppercase'
            style={{ letterSpacing: 0.6 }}
          >
            {messages.nowPlayingOn}
          </Text>
          <AudiusLogo fill={neutralLight2} height={24} width={115} />
        </View>
      </View>
    </View>
  )
}
