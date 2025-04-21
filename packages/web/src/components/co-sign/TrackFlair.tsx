import { useMemo, ReactNode, RefObject } from 'react'

import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import {
  Divider,
  Flex,
  HoverCard,
  HoverCardHeader,
  IconHeart,
  IconRepost,
  Origin,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import { HoverCardBody } from 'components/hover-card'
import { IconFavorite } from 'components/notification/Notification/components/icons'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges'
import { useIsMobile } from 'hooks/useIsMobile'

import Check from './Check'
import styles from './CoSign.module.css'
import HoverInfo from './HoverInfo'
import { Size } from './types'

const anchorOrigin: Origin = {
  horizontal: 'center',
  vertical: 'top'
}

const transformOrigin: Origin = {
  horizontal: 'center',
  vertical: 'top'
}

const CoSignCheck = ({
  coSignName,
  hasReposted,
  hasFavorited,
  size,
  userId
}: {
  coSignName: string
  hasFavorited: boolean
  hasReposted: boolean
  size: Size
  userId: ID
}) => {
  const message =
    hasReposted && hasFavorited
      ? 'Reposted & Favorited'
      : hasReposted
        ? 'Reposted'
        : 'Favorited'
  const icons =
    hasReposted && hasFavorited ? (
      <>
        <IconRepost color='subdued' /> <IconHeart color='subdued' />
      </>
    ) : hasReposted ? (
      <IconRepost color='subdued' />
    ) : (
      <IconHeart color='subdued' />
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
              Co-SIGN
            </Text>
          </Flex>
          <Divider orientation='horizontal' />
          <Flex ph='m' pv='s' column gap='xs'>
            <Flex row justifyContent='center'>
              {' '}
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
      <Check size={size} />
    </HoverCard>
  )
}

// Define the CoSignProps interface
interface CoSignProps {
  size: Size
  children: ReactNode
  className?: string
  hideToolTip?: boolean
  id: ID
  forwardRef?: RefObject<HTMLDivElement>
}

const TrackFlair = (props: CoSignProps) => {
  const { forwardRef, size, children, className, id, hideToolTip } = props
  const { data: track } = useTrack(id)
  const isMobile = useIsMobile()

  if (!track) return

  const remixTrack = track.remix_of?.tracks[0]
  const hasRemixAuthorReposted = remixTrack?.has_remix_author_reposted ?? false
  const hasRemixAuthorSaved = remixTrack?.has_remix_author_saved ?? false

  const isCosign = hasRemixAuthorReposted || hasRemixAuthorSaved

  const flair = isCosign ? (
    isMobile || hideToolTip ? (
      <Check size={size} />
    ) : (
      <CoSignCheck
        coSignName={remixTrack?.user.name}
        hasFavorited={hasRemixAuthorSaved}
        hasReposted={hasRemixAuthorReposted}
        size={size}
        userId={remixTrack?.user.user_id}
        forwardRef={forwardRef}
      />
    )
  ) : null

  return (
    <div ref={forwardRef} className={cn(styles.content, className)}>
      <div className={styles.children}>{children}</div>
      <div
        className={cn(styles.check, {
          [styles.tiny]: size === Size.TINY,
          [styles.small]: size === Size.SMALL,
          [styles.medium]: size === Size.MEDIUM,
          [styles.large]: size === Size.LARGE,
          [styles.xlarge]: size === Size.XLARGE
        })}
      >
        {flair}
      </div>
    </div>
  )
}

export { Size }
export default TrackFlair
