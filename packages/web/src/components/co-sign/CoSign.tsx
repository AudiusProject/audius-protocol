import { useMemo, ReactNode, RefObject } from 'react'

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

type CoSignProps =
  | {
      coSignName: string
      userId: ID
      hasFavorited: boolean
      hasReposted: boolean
      hideTooltip?: boolean
      size: Size
      children: ReactNode
      className?: string
      forwardRef?: RefObject<HTMLDivElement>
    }
  | {
      hideTooltip: true
      size: Size
      children: ReactNode
      className?: string
      forwardRef?: RefObject<HTMLDivElement>
    }

const CoSign = (props: CoSignProps) => {
  const { forwardRef, size, children, className } = props
  const isMobile = useIsMobile()
  const check =
    isMobile || props.hideTooltip ? (
      <Check size={size} />
    ) : (
      <CoSignCheck
        coSignName={props.coSignName}
        hasFavorited={props.hasFavorited}
        hasReposted={props.hasReposted}
        size={size}
        userId={props.userId}
      />
    )

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
        {check}
      </div>
    </div>
  )
}

export { Size }
export default CoSign
