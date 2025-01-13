import { useSupporter } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { ID } from '@audius/common/models'
import {
  Flex,
  IconComponent,
  IconStar,
  IconTipping,
  IconTrophy,
  Text
} from '@audius/harmony'

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
  const { data: supporter } = useSupporter({
    userId: artistId,
    supporterUserId: commentUserId
  })

  const badgeType = isArtist
    ? 'artist'
    : supporter?.rank === 1
      ? 'topSupporter'
      : supporter
        ? 'tipSupporter'
        : null

  if (badgeType === null) return null

  const Icon = iconMap[badgeType]

  return (
    <Flex gap='xs' alignItems='center'>
      <Icon color='accent' size='2xs' />
      <Text color='accent' variant='body' size='s'>
        {messages[badgeType]}
      </Text>
    </Flex>
  )
}
