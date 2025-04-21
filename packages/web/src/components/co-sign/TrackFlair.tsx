import { useMemo, ReactNode, RefObject } from 'react'

import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'

import Check from './Check'
import styles from './CoSign.module.css'
import HoverInfo from './HoverInfo'
import { Size } from './types'

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
  const tooltipText = useMemo(() => {
    return (
      <HoverInfo
        coSignName={coSignName}
        hasReposted={hasReposted}
        hasFavorited={hasFavorited}
        userId={userId}
      />
    )
  }, [coSignName, hasReposted, hasFavorited, userId])

  return (
    <Tooltip
      shouldWrapContent={false}
      mouseEnterDelay={0.1}
      shouldDismissOnClick={false}
      text={tooltipText}
      mount='page'
      className={styles.tooltip}
      color='white'
    >
      <div>
        <Check size={size} />
      </div>
    </Tooltip>
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
