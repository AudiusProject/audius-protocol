import { ID } from '@audius/common/models'
import {
  Divider,
  Flex,
  HoverCard,
  IconCosign,
  IconHeart,
  IconRepost,
  Origin,
  Text
} from '@audius/harmony'

import UserBadges from 'components/user-badges'
import { useIsMobile } from 'hooks/useIsMobile'

import FlairIcon from './FlairIcon'
import { Size } from './types'

const anchorOrigin: Origin = {
  horizontal: 'center',
  vertical: 'top'
}

const transformOrigin: Origin = {
  horizontal: 'center',
  vertical: 'bottom'
}

const messages = { title: 'Co-Sign' }

const CoSignFlair = ({
  coSignName,
  hasReposted,
  hasFavorited,
  size,
  userId,
  hideToolTip
}: {
  coSignName: string
  hasFavorited: boolean
  hasReposted: boolean
  size: Size
  userId: ID
  hideToolTip?: boolean
}) => {
  const isMobile = useIsMobile()

  if (isMobile || hideToolTip) {
    return <FlairIcon Icon={IconCosign} size={size} />
  }

  const message =
    hasReposted && hasFavorited
      ? 'Reposted & Favorited'
      : hasReposted
        ? 'Reposted'
        : 'Favorited'
  const icons =
    hasReposted && hasFavorited ? (
      <>
        <IconRepost color='default' /> <IconHeart color='default' />
      </>
    ) : hasReposted ? (
      <IconRepost color='default' />
    ) : (
      <IconHeart color='default' />
    )

  return (
    <HoverCard
      content={
        <Flex
          column
          css={{
            minWidth: 200
          }}
        >
          <Flex ph='m' pv='s' justifyContent='center'>
            <Text size='m' textAlign='center' variant='label'>
              {messages.title}
            </Text>
          </Flex>
          <Divider orientation='horizontal' />
          <Flex ph='m' pv='s' column gap='xs'>
            <Flex row justifyContent='center' alignItems='center' gap='xs'>
              <Text textAlign='center'> {coSignName}</Text>
              <UserBadges userId={userId} />
            </Flex>
            <Flex row gap='s' justifyContent='center'>
              {icons}
              <Text strength='strong' textAlign='center'>
                {message}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      <FlairIcon Icon={IconCosign} fill='subdued' size={size} />
    </HoverCard>
  )
}
export default CoSignFlair
