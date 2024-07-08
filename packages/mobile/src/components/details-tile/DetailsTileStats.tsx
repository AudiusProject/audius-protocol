import { pluralize } from '@audius/common/utils'

import { Flex, IconHeart, IconPlay, IconRepost } from '@audius/harmony-native'
import type { GestureResponderHandler } from 'app/types/gesture'

import { DetailsTileStat } from './DetailsStat'

const messages = {
  favorites: (count: number) => `${pluralize('Favorite', count)}`,
  reposts: (count: number) => `${pluralize('Repost', count)}`
}

type DetailsTileStatsProps = {
  playCount?: number
  repostCount?: number
  favoriteCount?: number
  hidePlayCount?: boolean
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
  const shouldHidePlayCount = hidePlayCount || playCount <= 0
  const shouldHideRepostCount = hideRepostCount || repostCount <= 0
  const shouldHideFavoriteCount = hideFavoriteCount || favoriteCount <= 0
  if (shouldHideFavoriteCount && shouldHideRepostCount && shouldHidePlayCount) {
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
      {shouldHidePlayCount ? null : (
        <DetailsTileStat count={playCount} icon={IconPlay} />
      )}
      {shouldHideRepostCount ? null : (
        <DetailsTileStat
          count={repostCount}
          onPress={onPressReposts}
          icon={IconRepost}
          label={messages.reposts(repostCount)}
        />
      )}
      {shouldHideFavoriteCount ? null : (
        <DetailsTileStat
          count={favoriteCount}
          onPress={onPressFavorites}
          icon={IconHeart}
          label={messages.favorites(favoriteCount)}
        />
      )}
    </Flex>
  )
}
