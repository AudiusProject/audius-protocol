import React from 'react'
import Paper from 'components/Paper'
import styles from './StatsChip.module.css'
import clsx from 'clsx'
import Tooltip, { Position } from 'components/Tooltip'
import Loading from 'components/Loading'

export const Divider = ({ className }: { className?: string }) => {
  return (
    <div className={clsx(styles.divider, { [className!]: !!className })}></div>
  )
}

type StatsChipProps = {
  className?: string
  tooltipText: string
  primaryStat: string
  primaryStatName: string
  isLoading: boolean
}

/** Wrapper for showing stats, used on the SP page */
const StatsChip: React.FC<StatsChipProps> = ({
  children,
  className,
  tooltipText,
  primaryStat,
  primaryStatName,
  isLoading
}) => {
  return (
    <Paper className={clsx(styles.statsChip, className)}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      ) : (
        <>
          <Tooltip
            position={Position.TOP}
            text={tooltipText}
            className={styles.tooltipStyle}
          >
            {primaryStat}
          </Tooltip>
          <div className={styles.label}>{primaryStatName}</div>
          <Divider />
          {children}
        </>
      )}
    </Paper>
  )
}

export default StatsChip
