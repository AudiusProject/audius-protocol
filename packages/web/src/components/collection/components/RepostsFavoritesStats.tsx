import { useCallback, MouseEvent } from 'react'

import { formatCount, pluralize } from '@audius/common/utils'
import {
  Flex,
  IconHeart as IconFavorite,
  IconRepost,
  PlainButton
} from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

type RepostsFavoritesStatsProps = {
  repostCount: number
  saveCount: number
  onClickReposts?: () => void
  onClickFavorites?: () => void
  className?: string
}

const messages = {
  reposts: 'Repost',
  favorites: 'Favorite'
}

// NOTE: this is a newer version of the other RepostsFavoritesStats component;
// unclear if designers want to deprecate the old one just yet so this is a standalone component for CollectionHeader
export const RepostsFavoritesStats = ({
  repostCount,
  saveCount,
  onClickReposts,
  onClickFavorites
}: RepostsFavoritesStatsProps) => {
  const isMobile = useIsMobile()
  const handleOnClickReposts = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClickReposts?.()
    },
    [onClickReposts]
  )
  const handleOnClickFavorites = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClickFavorites?.()
    },
    [onClickFavorites]
  )

  return !!repostCount || !!saveCount ? (
    <Flex alignItems='center' gap={isMobile ? 'xl' : 'l'}>
      {!!repostCount && (
        <PlainButton
          size={isMobile ? 'default' : 'large'}
          variant={isMobile ? 'default' : 'subdued'}
          iconLeft={IconRepost}
          onClick={handleOnClickReposts}
          css={{ padding: 0 }}
        >
          <span>{formatCount(repostCount)}</span>
          {pluralize(messages.reposts, repostCount)}
        </PlainButton>
      )}
      {!!saveCount && (
        <PlainButton
          size={isMobile ? 'default' : 'large'}
          variant={isMobile ? 'default' : 'subdued'}
          iconLeft={IconFavorite}
          onClick={handleOnClickFavorites}
          css={{ padding: 0 }}
        >
          <span>{formatCount(saveCount)}</span>
          {pluralize(messages.favorites, saveCount)}
        </PlainButton>
      )}
    </Flex>
  ) : null
}
