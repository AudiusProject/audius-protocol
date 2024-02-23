import React from 'react'

import clsx from 'clsx'
import SimpleBar from 'simplebar-react'

import Modal from 'components/Modal'
import { TimelineEvent as TimelineEventType } from 'models/TimelineEvents'

import TimelineEvent from './TimelineEvent'
import styles from './TimelineModal.module.css'

const messages = {
  title: 'Timeline'
}

type OwnProps = {
  className?: string
  isOpen: boolean
  onClose: () => void
  events: TimelineEventType[]
}

type TimelineModalProps = OwnProps

const TimelineModal: React.FC<TimelineModalProps> = ({
  className,
  isOpen,
  onClose,
  events
}: TimelineModalProps) => {
  return (
    <Modal
      isCloseable
      dismissOnClickOutside
      wrapperClassName={styles.timelineWrapper}
      headerClassName={styles.headerClassName}
      className={clsx(styles.timelineContainer, { [className!]: !!className })}
      isOpen={isOpen}
      onClose={onClose}
      title={messages.title}
    >
      <SimpleBar className={styles.scrollable}>
        {events.map((event, i) => (
          <TimelineEvent
            className={styles.modalEvent}
            key={i}
            isDisabled
            event={event}
          />
        ))}
      </SimpleBar>
    </Modal>
  )
}

export default TimelineModal
