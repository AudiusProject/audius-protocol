import { Flex, IconHeart, IconRepost } from '@audius/harmony-native'
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
  hideRepostCount?: boolean
  onPressFavorites?: GestureResponderHandler
  onPressReposts?: GestureResponderHandler
  repostCount?: number
}

/**
 * The stats displayed on track and playlist screens
 */
export const DetailsTileStats = ({
  favoriteCount,
  repostCount,
  hideFavoriteCount,
  hideRepostCount,
  onPressFavorites,
  onPressReposts
}: DetailsTileStatsProps) => {
  if (
    (hideFavoriteCount && hideRepostCount) ||
    (!favoriteCount && !repostCount)
  ) {
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
