import { useCurrentCommentSection } from '@audius/common/context'
import type { ID } from '@audius/common/models'
import { tippingSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { IconComponent } from '@audius/harmony-native'
import {
  Flex,
  IconStar,
  IconTipping,
  IconTrophy,
  Text
} from '@audius/harmony-native'

const { getSupporters } = tippingSelectors

type BadgeType = 'artist' | 'topSupporter' | 'tipSupporter'

const iconMap: Record<BadgeType, IconComponent> = {
  artist: IconStar,
  topSupporter: IconTrophy,
  tipSupporter: IconTipping
}
const messages: Record<BadgeType, string> = {
  artist: 'Artist',
  topSupporter: 'Top Supporter',
  tipSupporter: 'Tip Supporter'
}

const CommentBadge = ({ type }: { type: BadgeType | null }) => {
  if (type === null) return null

  const Icon = iconMap[type]
  return (
    <Flex direction='row' gap='xs'>
      <Icon color='accent' size='xs' />
      <Text color='accent' variant='body' size='xs'>
        {messages[type]}
      </Text>
    </Flex>
  )
}

type CommentBadgesProps = {
  isArtist: boolean
  commentUserId: ID
}

export const CommentBadges = ({
  commentUserId,
  isArtist
}: CommentBadgesProps) => {
  const { artistId } = useCurrentCommentSection()
  const supporters = useSelector(getSupporters)
  const tipSupporterData = supporters?.[artistId]?.[commentUserId]
  const isTipSupporter = tipSupporterData !== undefined // TODO: how to wire this up?
  const isTopSupporter = tipSupporterData?.rank === 1 // TODO: how to wire this up?
  const badgeType = isArtist
    ? 'artist'
    : isTopSupporter
    ? 'topSupporter'
    : isTipSupporter
    ? 'tipSupporter'
    : null
  return <CommentBadge type={badgeType} />
}
