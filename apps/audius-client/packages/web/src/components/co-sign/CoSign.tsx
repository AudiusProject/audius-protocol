import React, { useMemo, ReactNode, RefObject } from 'react'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'
import HoverInfo from './HoverInfo'
import Check from './Check'
import { Size } from './types'

import styles from './CoSign.module.css'
import { useIsMobile } from 'utils/clientUtil'

const CoSignCheck = ({
  coSignName,
  isVerified,
  hasReposted,
  hasFavorited,
  size
}: {
  coSignName: string
  isVerified: boolean
  hasFavorited: boolean
  hasReposted: boolean
  size: Size
}) => {
  const tooltipText = useMemo(() => {
    return (
      <HoverInfo
        coSignName={coSignName}
        isVerified={isVerified}
        hasReposted={hasReposted}
        hasFavorited={hasFavorited}
      />
    )
  }, [coSignName, isVerified, hasReposted, hasFavorited])

  return (
    <Tooltip
      shouldWrapContent={false}
      mouseEnterDelay={0.1}
      shouldDismissOnClick={false}
      text={tooltipText}
      mount='page'
      className={styles.tooltip}
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
      isVerified: boolean
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
        isVerified={props.isVerified}
        hasFavorited={props.hasFavorited}
        hasReposted={props.hasReposted}
        size={size}
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
