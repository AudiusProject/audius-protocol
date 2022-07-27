import { StyleSheet, View } from 'react-native'

import IconFavorite from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import type { ThemeColors } from 'app/utils/theme'

import { DetailsTileStat } from './DetailsStat'

const messages = {
  plays: 'Plays'
}

type DetailsTileStatsProps = {
  favoriteCount?: number
  hideFavoriteCount?: boolean
  hideListenCount?: boolean
  hideRepostCount?: boolean
  onPressFavorites?: GestureResponderHandler
  onPressReposts?: GestureResponderHandler
  playCount?: number
  repostCount?: number
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
export const DetailsTileStats = ({
  favoriteCount,
  hideFavoriteCount,
  hideListenCount,
  hideRepostCount,
  onPressFavorites,
  onPressReposts,
  playCount = 0,
  repostCount
}: DetailsTileStatsProps) => {
  const styles = useThemedStyles(createStyles)

  return (
    <>
      {(!hideListenCount || !hideFavoriteCount || !hideRepostCount) && (
        <View style={styles.statsContainer}>
          {hideListenCount ? null : (
            <DetailsTileStat
              count={playCount}
              renderLabel={(color) => (
                <Text style={[styles.countLabel, { color }]}>
                  {messages.plays}
                </Text>
              )}
            />
          )}
          {hideFavoriteCount ? null : (
            <DetailsTileStat
              count={favoriteCount ?? 0}
              onPress={onPressFavorites}
              renderLabel={(color) => (
                <IconFavorite fill={color} height={16} width={16} />
              )}
            />
          )}
          {hideRepostCount ? null : (
            <DetailsTileStat
              count={repostCount ?? 0}
              onPress={onPressReposts}
              renderLabel={(color) => (
                <IconRepost fill={color} height={18} width={18} />
              )}
            />
          )}
        </View>
      )}
    </>
  )
}
