import React from 'react'

import { Modal, Anchor } from '@audius/stems'

import FeedFilter from 'common/models/FeedFilter'

import styles from './FeedFilterModal.module.css'

interface FeedFilterModalProps {
  filters: FeedFilter[]
  isOpen: boolean
  onClose: () => void
  didSelectFilter: (filter: FeedFilter) => void
}

const messages = {
  title: 'What do you want to see in your feed?',
  filterAll: 'All Posts',
  filterOriginal: 'Original Posts',
  filterReposts: 'Reposts'
}

const filterMessageMap = {
  [FeedFilter.ALL]: messages.filterAll,
  [FeedFilter.ORIGINAL]: messages.filterOriginal,
  [FeedFilter.REPOST]: messages.filterReposts
}

const MODAL_OFFSET_PIXELS = 41

const FeedFilterModal = ({
  filters,
  isOpen,
  didSelectFilter,
  onClose
}: FeedFilterModalProps) => {
  const onClickFilter = (filter: FeedFilter) => {
    didSelectFilter(filter)
    onClose()
  }

  return (
    <Modal
      bodyClassName={styles.modalBody}
      onClose={onClose}
      isOpen={isOpen}
      anchor={Anchor.BOTTOM}
      verticalAnchorOffset={MODAL_OFFSET_PIXELS}
    >
      <div className={styles.container}>
        <div className={styles.title}>{messages.title}</div>
        {filters.map(filter => (
          <div
            key={filter}
            className={styles.filterItem}
            onClick={() => {
              onClickFilter(filter)
            }}
          >
            {filterMessageMap[filter]}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default FeedFilterModal
