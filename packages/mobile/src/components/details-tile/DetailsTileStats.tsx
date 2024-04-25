import { Flex, Text, IconHeart, IconRepost, Box } from '@audius/harmony-native'
import type { GestureResponderHandler } from 'app/types/gesture'

import { DetailsTileStat } from './DetailsStat'

const messages = {
  plays: 'Plays',
  favorites: 'Favorites',
  reposts: 'Reposts'
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
  if (hideListenCount && hideFavoriteCount && hideRepostCount) {
    return null
  }
  return (
    <Flex
      w='100%'
      direction='row'
      gap='xl'
      alignItems='center'
      justifyContent='flex-start'
    >
      {hideListenCount ? null : (
        <DetailsTileStat
          count={playCount}
          icon={IconRepost}
          label={messages.plays}
        />
      )}
      {hideRepostCount ? null : (
        <DetailsTileStat
          count={repostCount ?? 0}
          onPress={onPressReposts}
          icon={IconRepost}
          label={messages.reposts}
        />
      )}
      {hideFavoriteCount ? null : (
        <DetailsTileStat
          count={favoriteCount ?? 0}
          onPress={onPressFavorites}
          icon={IconHeart}
          label={messages.favorites}
        />
      )}
    </Flex>
  )
}
