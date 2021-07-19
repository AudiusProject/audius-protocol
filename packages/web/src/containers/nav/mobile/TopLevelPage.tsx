import React from 'react'

import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import AddToPlaylistPage from 'containers/add-to-playlist/mobile/AddToPlaylist'
import { getIsOpen as getIsAddToPlaylistPageOpen } from 'containers/add-to-playlist/store/selectors'
import ConfirmAudioToWAudioPage from 'containers/confirm-audio-to-waudio/mobile/ConfirmAudioToWAudioPage'
import EditPlaylistPage from 'containers/edit-playlist/mobile/EditPlaylistPage'
import useScrollLock from 'hooks/useScrollLock'
import { getIsOpen as getIsCreatePlaylistModalOpen } from 'store/application/ui/createPlaylistModal/selectors'
import { getModalVisibility } from 'store/application/ui/modals/slice'
import { AppState } from 'store/types'

import styles from './TopLevelPage.module.css'

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement = document.querySelector('#root')

const TopLevelPage = ({
  showCreatePlaylist,
  showAddToPlaylist,
  showConvertAudioToWAudio
}: TopLevelPageProps) => {
  const showPage =
    showCreatePlaylist || showAddToPlaylist || showConvertAudioToWAudio
  const isLocked = !!(showPage && rootElement)
  const hideTopAndBottom = showConvertAudioToWAudio
  useScrollLock(isLocked)

  let page = null
  if (showCreatePlaylist) {
    page = <EditPlaylistPage />
  } else if (showAddToPlaylist) {
    page = <AddToPlaylistPage />
  } else if (showConvertAudioToWAudio) {
    page = <ConfirmAudioToWAudioPage />
  }

  return (
    <div
      className={cn(styles.topLevelPage, {
        [styles.show]: showPage,
        [styles.darkerBackground]: showAddToPlaylist,
        [styles.hideTopAndBottom]: hideTopAndBottom
      })}
    >
      {page}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    showCreatePlaylist: getIsCreatePlaylistModalOpen(state),
    showAddToPlaylist: getIsAddToPlaylistPageOpen(state),
    showConvertAudioToWAudio: getModalVisibility(state, 'ConfirmAudioToWAudio')
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
