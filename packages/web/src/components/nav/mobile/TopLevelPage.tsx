import { modalsSelectors, useEditPlaylistModal } from '@audius/common'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import AddToCollectionPage from 'components/add-to-collection/mobile/AddToCollection'
import EditPlaylistPage from 'components/edit-collection/mobile/EditPlaylistPage'
import useScrollLock from 'hooks/useScrollLock'
import { AppState } from 'store/types'

import styles from './TopLevelPage.module.css'
const { getModalVisibility } = modalsSelectors

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement = document.querySelector('#root')

const TopLevelPage = ({ showAddToCollection }: TopLevelPageProps) => {
  const { isOpen } = useEditPlaylistModal()
  const showPage = isOpen || showAddToCollection
  const isLocked = !!(showPage && rootElement)
  useScrollLock(isLocked)

  let page = null
  if (isOpen) {
    page = <EditPlaylistPage />
  } else if (showAddToCollection) {
    page = <AddToCollectionPage />
  }

  return (
    <div
      className={cn(styles.topLevelPage, {
        [styles.show]: showPage,
        [styles.darkerBackground]: showAddToCollection
      })}
    >
      {page}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    showAddToCollection: getModalVisibility(state, 'AddToCollection')
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
