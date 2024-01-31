import { useCallback } from 'react'

import type { Remix, User } from '@audius/common/models'
import { playerSelectors } from '@audius/common/store'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconVolume from 'app/assets/images/iconVolume.svg'
import { Text, FadeInView } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

import { LineupTileArt } from './LineupTileArt'
import { useStyles as useTrackTileStyles } from './styles'
import type { LineupTileProps } from './types'

const { getPlaying } = playerSelectors

const useStyles = makeStyles(({ palette }) => ({
  metadata: {
    flexDirection: 'row'
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
    color: palette.primary,
    fontSize: 12,
    letterSpacing: 1,
    lineHeight: 15,
    textTransform: 'uppercase'
  }
}))

const messages = {
  coSign: 'Co-Sign'
}

type Props = {
  artistName: string
  coSign?: Remix | null
  onPressTitle?: GestureResponderHandler
  renderImage: LineupTileProps['renderImage']
  title: string
  user: User
  isPlayingUid: boolean
}

export const LineupTileMetadata = ({
  artistName,
  coSign,
  onPressTitle,
  renderImage,
  title,
  user,
  isPlayingUid
}: Props) => {
  const navigation = useNavigation()
  const styles = useStyles()
  const trackTileStyles = useTrackTileStyles()
  const { primary } = useThemeColors()

  const isActive = isPlayingUid

  const isPlaying = useSelector((state) => {
    return getPlaying(state) && isActive
  })

  const handleArtistPress = useCallback(() => {
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])
  return (
    <View style={styles.metadata}>
      <LineupTileArt
        renderImage={renderImage}
        coSign={coSign}
        style={trackTileStyles.imageContainer}
      />
      <FadeInView
        style={trackTileStyles.titles}
        startOpacity={0}
        duration={500}
      >
        <TouchableOpacity style={trackTileStyles.title} onPress={onPressTitle}>
          <>
            <Text
              color={isActive ? 'primary' : 'neutral'}
              weight='bold'
              numberOfLines={1}
            >
              {title}
            </Text>
            {isPlaying ? (
              <IconVolume fill={primary} style={styles.playingIndicator} />
            ) : null}
          </>
        </TouchableOpacity>
        <TouchableOpacity
          style={trackTileStyles.artist}
          onPress={handleArtistPress}
        >
          <Text
            color={isActive ? 'primary' : 'neutral'}
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
        </TouchableOpacity>
      </FadeInView>
      {coSign && (
        <Text style={styles.coSignLabel} weight='heavy'>
          {messages.coSign}
        </Text>
      )}
    </View>
  )
}
