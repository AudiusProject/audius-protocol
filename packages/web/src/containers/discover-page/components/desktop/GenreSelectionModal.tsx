import React from 'react'
import AudiusModal from 'components/general/AudiusModal'
import SimpleBar from 'simplebar-react'
import GenreSelectionList from 'containers/discover-page/components/GenreSelectionList'

import styles from './GenreSelectionModal.module.css'

type GenreSelectionModalProps = {
  genres: string[]
  selectedGenre: string | null
  didSelectGenre: (genre: string | null) => void
  didClose: () => void
  isOpen: boolean
}

const messages = {
  title: 'Pick a Genre',
  all: 'All Genres',
  searchPlaceholder: 'Search Genres'
}

const GenreSelectionModal = ({
  genres,
  selectedGenre,
  didSelectGenre,
  didClose,
  isOpen
}: GenreSelectionModalProps) => {
  return (
    <AudiusModal
      isOpen={isOpen}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={didClose}
      allowScroll={false}
      bodyClassName={styles.modalBody}
    >
      <SimpleBar className={styles.simpleBar}>
        <GenreSelectionList
          genres={genres}
          didSelectGenre={didSelectGenre}
          selectedGenre={selectedGenre}
        />
      </SimpleBar>
    </AudiusModal>
  )
}

export default GenreSelectionModal
