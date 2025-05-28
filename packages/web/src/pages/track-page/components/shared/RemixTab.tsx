import { ID } from '@audius/common/models'
import { Flex, IconArrowRight, PlainButton, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { RemixGrid, RemixSubmissionCardSize } from './RemixGrid'

type RemixTabProps = {
  trackId: ID
  trackIds: ID[]
  size?: RemixSubmissionCardSize
  emptyState: {
    title: string
    subtitle: string
  }
  viewAllLink?: {
    pathname: string
    search?: string
  }
  viewAllText?: string
}

export const RemixTab = ({
  trackId,
  trackIds,
  size = 'desktop',
  emptyState,
  viewAllLink,
  viewAllText = 'View All'
}: RemixTabProps) => {
  // If there are no tracks, show the empty state
  if (trackIds.length === 0) {
    return (
      <Flex
        column
        pv={size === 'mobile' ? 'xl' : '3xl'}
        gap={size === 'mobile' ? 's' : 'xs'}
        alignItems='center'
        w={size === 'mobile' ? '100%' : undefined}
      >
        <Text variant='title'>{emptyState.title}</Text>
        <Text variant='body' color='subdued'>
          {emptyState.subtitle}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex
      column
      p={size === 'mobile' ? 'xl' : 'xl'}
      pb={size === 'mobile' ? 'm' : 'xl'}
      gap={size === 'mobile' ? '2xl' : 'xl'}
      w={size === 'mobile' ? '100%' : undefined}
    >
      <RemixGrid trackIds={trackIds} size={size} />
      {viewAllLink && (
        <Flex justifyContent='center'>
          <PlainButton
            size={size === 'mobile' ? undefined : 'large'}
            iconRight={IconArrowRight}
            asChild
          >
            <Link to={viewAllLink}>{viewAllText}</Link>
          </PlainButton>
        </Flex>
      )}
    </Flex>
  )
}
