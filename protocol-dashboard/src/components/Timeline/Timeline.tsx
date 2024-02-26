import { useEffect } from 'react'

import clsx from 'clsx'

import Loading from 'components/Loading'
import Paper from 'components/Paper'
import { TimelineType, useTimeline } from 'store/cache/timeline/hooks'
import { Address } from 'types'
import { useModalControls } from 'utils/hooks'

import styles from './Timeline.module.css'
import TimelineEvent from './TimelineEvent'
import TimelineModal from './TimelineModal'

const messages = {
  title: 'Timeline',
  emptyTimeline: 'No Events',
  viewAll: 'View All Timeline Events'
}

const MAX_LEN = 4

type TimelineProps = {
  className?: string
  limit?: number
  wallet: Address
  timelineType: TimelineType
}

const Timeline = ({ className, wallet, timelineType }: TimelineProps) => {
  const { timeline } = useTimeline(wallet, timelineType)
  const { isOpen, onClick, onClose } = useModalControls()
  useEffect(() => {
    onClose()
  }, [wallet, onClose])
  return (
    <Paper className={clsx({ [className!]: !!className })}>
      <h3 className={styles.title}>{messages.title}</h3>
      {Array.isArray(timeline) ? (
        timeline.length > 0 ? (
          timeline
            .slice(0, 4)
            .map((event, i) => (
              <TimelineEvent key={i} event={event} onClick={onClick} />
            ))
        ) : (
          <div className={styles.emptyTimeline}>{messages.emptyTimeline}</div>
        )
      ) : (
        <div className={styles.loadingContainer}>
          <Loading className={styles.loading} />
        </div>
      )}
      {Array.isArray(timeline) && timeline.length > MAX_LEN && (
        <div className={styles.viewAll} onClick={onClick}>
          {messages.viewAll}
        </div>
      )}
      <TimelineModal
        events={timeline || []}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Paper>
  )
}

export default Timeline
