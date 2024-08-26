import { useCurrentCommentSection } from '@audius/common/context'
import { ID } from '@audius/common/models'
import { getSupporters } from '@audius/common/src/store/tipping/selectors'
import {
  Flex,
  IconComponent,
  IconStar,
  IconTipping,
  IconTrophy,
  Text
} from '@audius/harmony'
import { useSelector } from 'react-redux'

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
    <Flex gap='xs'>
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
