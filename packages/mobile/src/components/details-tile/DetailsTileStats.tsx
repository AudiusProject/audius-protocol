import { Flex, IconHeart, IconPlay, IconRepost } from '@audius/harmony-native'
import type { GestureResponderHandler } from 'app/types/gesture'

import { DetailsTileStat } from './DetailsStat'

const messages = {
  plays: 'Plays',
  favorites: 'Favorites',
  reposts: 'Reposts'
}

type DetailsTileStatsProps = {
  playCount?: number
  repostCount?: number
  favoriteCount?: number
  hidePlayCount?: number
  hideRepostCount?: boolean
  hideFavoriteCount?: boolean
  onPressFavorites?: GestureResponderHandler
  onPressReposts?: GestureResponderHandler
}

/**
 * The stats displayed on track and playlist screens
 */
export const DetailsTileStats = ({
  playCount = 0,
  repostCount = 0,
  favoriteCount = 0,
  hidePlayCount,
  hideRepostCount,
  hideFavoriteCount,
  onPressFavorites,
  onPressReposts
}: DetailsTileStatsProps) => {
  if (
    (hideFavoriteCount && hideRepostCount && hidePlayCount) ||
    (!favoriteCount && !repostCount && !playCount)
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
      {hidePlayCount && playCount > 0 ? null : (
        <DetailsTileStat count={playCount} icon={IconPlay} />
      )}
      {hideRepostCount ? null : (
        <DetailsTileStat
          count={repostCount}
          onPress={onPressReposts}
          icon={IconRepost}
          label={messages.reposts}
        />
      )}
      {hideFavoriteCount ? null : (
        <DetailsTileStat
          count={favoriteCount}
          onPress={onPressFavorites}
          icon={IconHeart}
          label={messages.favorites}
        />
      )}
    </Flex>
  )
}
