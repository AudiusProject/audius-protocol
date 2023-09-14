import { modalsSelectors, useEditPlaylistModal } from '@audius/common'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import AddToPlaylistPage from 'components/add-to-playlist/mobile/AddToPlaylist'
import EditPlaylistPage from 'components/edit-playlist/mobile/EditPlaylistPage'
import useScrollLock from 'hooks/useScrollLock'
import { AppState } from 'store/types'

import styles from './TopLevelPage.module.css'
const { getModalVisibility } = modalsSelectors

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement = document.querySelector('#root')

const TopLevelPage = ({ showAddToPlaylist }: TopLevelPageProps) => {
  const { isOpen } = useEditPlaylistModal()
  const showPage = isOpen || showAddToPlaylist
  const isLocked = !!(showPage && rootElement)
  useScrollLock(isLocked)

  let page = null
  if (isOpen) {
    page = <EditPlaylistPage />
  } else if (showAddToPlaylist) {
    page = <AddToPlaylistPage />
  }

  return (
    <div
      className={cn(styles.topLevelPage, {
        [styles.show]: showPage,
        [styles.darkerBackground]: showAddToPlaylist
      })}
    >
      {page}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    showAddToPlaylist: getModalVisibility(state, 'AddToPlaylist')
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
