import React, { useEffect } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import clsx from 'clsx'

import { AppState } from '../../store/types'

import styles from './Timeline.module.css'
import Paper from '../../components/Paper'
import TimelineEvent from './TimelineEvent'
import { TimelineType, useTimeline } from '../../store/cache/timeline/hooks'
import { Address } from '../../types'
import Loading from '../../components/Loading'
import { useModalControls } from '../../utils/hooks'
import TimelineModal from './TimelineModal'

const messages = {
  title: 'Timeline',
  emptyTimeline: 'No Events',
  viewAll: 'View All Timeline Events'
}

const MAX_LEN = 4

type OwnProps = {
  className?: string
  limit?: number
  wallet: Address
  timelineType: TimelineType
}

type TimelineProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const Timeline: React.FC<TimelineProps> = ({
  className,
  wallet,
  timelineType
}: TimelineProps) => {
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

const mapStateToProps = (state: AppState) => {
  return {}
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    pushRoute: (path: string) => dispatch(pushRoute(path))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Timeline)
