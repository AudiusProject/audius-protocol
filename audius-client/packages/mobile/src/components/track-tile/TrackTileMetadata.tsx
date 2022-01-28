import React from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { CoverArtSizes } from 'audius-client/src/common/models/ImageSizes'
import { Remix } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { Pressable, StyleSheet, View } from 'react-native'

import IconVolume from 'app/assets/images/iconVolume.svg'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges/UserBadges'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { GestureResponderHandler } from 'app/types/gesture'
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
  goToArtistPage: GestureResponderHandler
  goToTrackPage: GestureResponderHandler
  id: ID
  isPlaying: boolean
  setArtworkLoaded: (loaded: boolean) => void
  title: string
  user: User
}

export const TrackTileMetadata = ({
  artistName,
  coSign,
  coverArtSizes,
  goToArtistPage,
  goToTrackPage,
  id,
  isPlaying,
  setArtworkLoaded,
  title,
  user
}: Props) => {
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { primary } = useThemeColors()
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
        <Pressable style={trackTileStyles.title} onPress={goToTrackPage}>
          <Text
            style={[styles.titleText, isPlaying && styles.titlesActive]}
            weight='bold'
            numberOfLines={1}
          >
            {title}
          </Text>
          {isPlaying && (
            <IconVolume fill={primary} style={styles.playingIndicator} />
          )}
        </Pressable>
        <Pressable style={trackTileStyles.artist} onPress={goToArtistPage}>
          <Text
            style={[styles.titleText, isPlaying && styles.titlesActive]}
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
