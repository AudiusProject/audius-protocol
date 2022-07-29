import { useCallback } from 'react'

import type { Remix, User } from '@audius/common'
import { StyleSheet, View } from 'react-native'

import IconVolume from 'app/assets/images/iconVolume.svg'
import { Pressable } from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { GestureResponderHandler } from 'app/types/gesture'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

import { LineupTileArt } from './LineupTileArt'
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
  imageUrl?: string
  isPlaying: boolean
  onPressTitle?: GestureResponderHandler
  setArtworkLoaded: (loaded: boolean) => void
  title: string
  user: User
}

export const LineupTileMetadata = ({
  artistName,
  coSign,
  imageUrl,
  isPlaying,
  onPressTitle,
  setArtworkLoaded,
  title,
  user
}: Props) => {
  const navigation = useNavigation()
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { primary } = useThemeColors()

  const handleArtistPress = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } },
      web: { route: `/${user.handle}` }
    })
  }, [navigation, user])

  return (
    <View style={styles.metadata}>
      <LineupTileArt
        imageUrl={imageUrl}
        onLoad={() => setArtworkLoaded(true)}
        coSign={coSign}
        style={trackTileStyles.imageContainer}
      />
      <View style={trackTileStyles.titles}>
        <Pressable style={trackTileStyles.title} onPress={onPressTitle}>
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
