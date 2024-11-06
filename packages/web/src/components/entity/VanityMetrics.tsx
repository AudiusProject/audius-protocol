import { useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import {
  IconMessage,
  Text,
  Flex,
  IconComponent,
  IconRepost,
  IconHeart,
  TextLink
} from '@audius/harmony'

import { Avatar } from 'components/avatar'
import { UserLink } from 'components/link'
import { useIsMobile } from 'hooks/useIsMobile'
import { pluralize } from 'utils/stringUtils'

type VanityMetricsProps = {
  trackId: ID
  size?: 'small' | 'large'
}

const VanityText = ({ children }: { children: React.ReactNode }) => (
  <Text variant='body' size='xs' color='subdued'>
    {children}
  </Text>
)

const LeaveComment = () => (
  <Flex alignItems='center' gap='xs'>
    <IconMessage size='s' color='subdued' />
    <VanityText>Leave a comment</VanityText>
  </Flex>
)

export const VanityMetrics = (props: VanityMetricsProps) => {
  const { trackId, size } = props
  const isMobile = useIsMobile()

  const { data: track } = useGetTrackById({ id: trackId })

  const {
    repost_count = 0,
    save_count = 0,
    comment_count = 0,
    followee_reposts = []
  } = track!

  const renderMetric = useCallback(
    (count: number, Icon: IconComponent) => (
      <Flex alignItems='center' gap='xs'>
        <Icon color='subdued' size='s' />
        <VanityText>{formatCount(count)}</VanityText>
      </Flex>
    ),
    []
  )

  const renderReposters = useCallback(() => {
    if (repost_count === 0) return null

    const renderAvatars = () => (
      <Flex alignItems='center'>
        {followee_reposts.slice(0, 3).map((repost, index) => (
          <Avatar
            key={repost.user_id}
            userId={repost.user_id}
            size='small'
            css={{ marginRight: index === 2 ? 0 : -4.8, zIndex: 3 - index }}
          />
        ))}
      </Flex>
    )

    const renderName = () => {
      const [repost] = followee_reposts
      const name = (
        <UserLink userId={repost.user_id} noBadges variant='subdued' popover />
      )

      const remainingCount = repost_count - 1
      const remainingText =
        remainingCount > 0
          ? ` + ${formatCount(remainingCount)} ${pluralize(
              'Repost',
              remainingCount
            )}`
          : ' Reposted'

      return (
        <VanityText>
          {name}
          {remainingText}
        </VanityText>
      )
    }

    const isLargeSize = size === 'large' && !isMobile

    return (
      <Flex alignItems='center' gap='xs'>
        {isLargeSize && followee_reposts.length >= 3 ? renderAvatars() : null}
        <IconRepost size='s' color='subdued' />
        {isLargeSize && followee_reposts.length > 0 ? (
          renderName()
        ) : (
          <VanityText>{formatCount(repost_count)}</VanityText>
        )}
      </Flex>
    )
  }, [repost_count, followee_reposts, isMobile, size])

  if (repost_count === 0 && save_count === 0 && comment_count === 0) {
    return <LeaveComment />
  }

  return (
    <Flex alignItems='center' gap='m'>
      {renderReposters()}
      {save_count > 0 && renderMetric(save_count, IconHeart)}
      {comment_count > 0 ? (
        renderMetric(comment_count, IconMessage)
      ) : (
        <LeaveComment />
      )}
    </Flex>
  )
}
