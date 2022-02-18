import { useCallback } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { CoverArtSizes } from 'audius-client/src/common/models/ImageSizes'
import { Remix } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View
} from 'react-native'

import IconVolume from 'app/assets/images/iconVolume.svg'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

import { TrackTileArt } from './TrackTileArt'
import { createStyles as createTrackTileStyles } from './styles'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    metadata: {
      flexDirection: 'row'
    },
    titlesActive: {
      color: themeColors.primary
    },
    titlesPressed: {
      textDecorationLine: 'underline'
    },
    titleText: {
      fontSize: 16
    },
    playingIndicator: {
      marginLeft: 8
    },
    badge: {
      marginLeft: 4
    },
    coSignLabel: {
      position: 'absolute',
      bottom: -3,
      left: 96,
      color: themeColors.primary,
      fontSize: 12,
      letterSpacing: 1,
      lineHeight: 15,
      textTransform: 'uppercase'
    }
  })

const messages = {
  coSign: 'Co-Sign'
}

type Props = {
  artistName: string
  coSign?: Remix | null
  coverArtSizes: CoverArtSizes
  id: ID
  isPlaying: boolean
  permalink: string
  setArtworkLoaded: (loaded: boolean) => void
  title: string
  user: User
}

export const TrackTileMetadata = ({
  artistName,
  coSign,
  coverArtSizes,
  id,
  isPlaying,
  permalink,
  setArtworkLoaded,
  title,
  user
}: Props) => {
  const navigation = useNavigation()
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { primary } = useThemeColors()

  const handleTitlePress = useCallback(
    (e: GestureResponderEvent) => {
      navigation.push({
        native: { screen: 'track', params: { id } },
        web: { route: permalink }
      })
    },
    [navigation, permalink, id]
  )

  const handleArtistPress = useCallback(
    (e: GestureResponderEvent) => {
      navigation.push({
        native: { screen: 'profile', params: { handle: user.handle } },
        web: { route: `/${user.handle}` }
      })
    },
    [navigation, user]
  )

  return (
    <View style={styles.metadata}>
      <TrackTileArt
        id={id}
        isTrack={true}
        onLoad={() => setArtworkLoaded(true)}
        coverArtSizes={coverArtSizes}
        coSign={coSign}
        style={trackTileStyles.imageContainer}
      />
      <View style={trackTileStyles.titles}>
        <Pressable style={trackTileStyles.title} onPress={handleTitlePress}>
          {({ pressed }) => (
            <>
              <Text
                style={[
                  styles.titleText,
                  isPlaying && styles.titlesActive,
                  pressed && styles.titlesPressed
                ]}
                weight='bold'
                numberOfLines={1}
              >
                {title}
              </Text>
              {!isPlaying ? null : (
                <IconVolume fill={primary} style={styles.playingIndicator} />
              )}
            </>
          )}
        </Pressable>
        <Pressable style={trackTileStyles.artist} onPress={handleArtistPress}>
          {({ pressed }) => (
            <>
              <Text
                style={[
                  styles.titleText,
                  isPlaying && styles.titlesActive,
                  pressed && styles.titlesPressed
                ]}
                weight='medium'
                numberOfLines={1}
              >
                {artistName}
              </Text>
              <UserBadges
                user={user}
                badgeSize={12}
                style={styles.badge}
                hideName
              />
            </>
          )}
        </Pressable>
      </View>
      {coSign && (
        <Text style={styles.coSignLabel} weight='heavy'>
          {messages.coSign}
        </Text>
      )}
    </View>
  )
}
