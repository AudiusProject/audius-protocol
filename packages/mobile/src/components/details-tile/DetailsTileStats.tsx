import { View } from 'react-native'

import { IconHeart, IconRepost } from '@audius/harmony-native'
import Text from 'app/components/text'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

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

const useStyles = makeStyles(({ palette }) => ({
  statsContainer: {
    ...flexRowCentered(),
    justifyContent: 'center'
  },
  countLabel: {
    fontSize: 16,
    color: palette.neutralLight4,
    textAlign: 'center'
  }
}))

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
  const styles = useStyles()

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
                <IconHeart fill={color} height={16} width={16} />
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
