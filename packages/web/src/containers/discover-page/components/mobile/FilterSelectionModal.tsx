import React from 'react'

import Modal, { Anchor } from 'components/general/AudiusModal'
import TimeRange from 'models/TimeRange'

import styles from './FilterSelectionModal.module.css'

interface FilterSelectionModalProps {
  timeRanges: TimeRange[]
  isOpen: boolean
  onClose: () => void
  didSelectFilter: (range: TimeRange) => void
}

const messages = {
  title: 'How do you want to sort Trending?',
  filterWeek: 'This Week',
  filterMonth: 'This Month',
  filterYear: 'All Time'
}

const filterMessageMap = {
  [TimeRange.YEAR]: messages.filterYear,
  [TimeRange.MONTH]: messages.filterMonth,
  [TimeRange.WEEK]: messages.filterWeek
}

const MODAL_OFFSET_PIXELS = 41

const FilterSelectionModal = ({
  timeRanges,
  isOpen,
  didSelectFilter,
  onClose
}: FilterSelectionModalProps) => {
  const onClickFilter = (filter: TimeRange) => {
    didSelectFilter(filter)
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      anchor={Anchor.BOTTOM}
      verticalAnchorOffset={MODAL_OFFSET_PIXELS}
    >
      <div className={styles.container}>
        <div className={styles.title}>{messages.title}</div>
        {timeRanges.map(r => (
          <div
            key={r}
            className={styles.filterItem}
            onClick={() => {
              onClickFilter(r)
            }}
          >
            {filterMessageMap[r]}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default FilterSelectionModal
