import { useCallback } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { StyleSheet, View } from 'react-native'

import IconFavorite from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { ThemeColors } from 'app/utils/theme'

import { TrackScreenStat } from './TrackScreenStat'

const messages = {
  plays: 'Plays'
}

type TrackScreenStatsProps = {
  favoriteCount: number
  playCount?: number
  repostCount: number
  showFavoriteCount: boolean
  showListenCount: boolean
  showRepostCount: boolean
  trackId: ID
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    statsContainer: {
      ...flexRowCentered(),
      justifyContent: 'center',
      marginBottom: 12
    },
    countLabel: {
      fontSize: 16,
      color: themeColors.neutralLight4,
      textAlign: 'center'
    }
  })

/**
 * The stats displayed on track and playlist screens
 */
export const TrackScreenStats = ({
  favoriteCount,
  playCount = 0,
  repostCount,
  showFavoriteCount,
  showListenCount,
  showRepostCount,
  trackId
}: TrackScreenStatsProps) => {
  const styles = useThemedStyles(createStyles)
  const onPressFavorites = useCallback(() => {
    // TODO: navigate to favorites
    // goToFavoritesPage(trackId)
  }, [trackId])

  const onPressReposts = useCallback(() => {
    // TODO: navigate to reposts
    // goToRepostsPage(trackId)
  }, [trackId])

  return (
    <>
      {(showListenCount || showFavoriteCount || showRepostCount) && (
        <View style={styles.statsContainer}>
          {showListenCount && (
            <TrackScreenStat
              count={playCount}
              renderLabel={color => (
                <Text style={[styles.countLabel, { color }]}>
                  {messages.plays}
                </Text>
              )}
            />
          )}
          {showFavoriteCount && (
            <TrackScreenStat
              count={favoriteCount}
              onPress={onPressFavorites}
              renderLabel={color => (
                <IconFavorite fill={color} height={16} width={16} />
              )}
            />
          )}
          {showRepostCount && (
            <TrackScreenStat
              count={repostCount}
              onPress={onPressReposts}
              renderLabel={color => (
                <IconRepost fill={color} height={18} width={18} />
              )}
            />
          )}
        </View>
      )}
    </>
  )
}
