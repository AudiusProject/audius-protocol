import React, { useEffect } from 'react'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

import { AppState } from 'store/types'
import { getIsOpen as getIsCreatePlaylistModalOpen } from 'store/application/ui/createPlaylistModal/selectors'
import { getIsOpen as getIsAddToPlaylistPageOpen } from 'containers/add-to-playlist/store/selectors'

import EditPlaylistPage from 'containers/edit-playlist/mobile/EditPlaylistPage'
import AddToPlaylistPage from 'containers/add-to-playlist/mobile/AddToPlaylist'

import styles from './TopLevelPage.module.css'

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement = document.querySelector('#root')

const TopLevelPage = ({
  showCreatePlaylist,
  showAddToPlaylist
}: TopLevelPageProps) => {
  const showPage = showCreatePlaylist || showAddToPlaylist

  useEffect(() => {
    if (showPage && rootElement) {
      disableBodyScroll(rootElement)
    }
    if (!showPage) {
      clearAllBodyScrollLocks()
    }
  }, [showPage])

  let page = null
  if (showCreatePlaylist) {
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
    showCreatePlaylist: getIsCreatePlaylistModalOpen(state),
    showAddToPlaylist: getIsAddToPlaylistPageOpen(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
