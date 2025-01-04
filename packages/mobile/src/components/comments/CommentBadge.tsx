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

type CommentBadgeProps = {
  isArtist: boolean
  commentUserId: ID
}

export const CommentBadge = ({
  commentUserId,
  isArtist
}: CommentBadgeProps) => {
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
  if (badgeType === null) return null

  const Icon = iconMap[badgeType]

  return (
    <Flex direction='row' gap='xs' alignItems='center'>
      <Icon color='accent' size='2xs' />
      <Text color='accent' variant='body' size='s'>
        {messages[badgeType]}
      </Text>
    </Flex>
  )
}
