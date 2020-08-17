import React, { useCallback } from 'react'
import { connect } from 'react-redux'

import styles from './NewPlaylistButton.module.css'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'

import * as createPlaylistActions from 'store/application/ui/createPlaylistModal/actions'
import { useRecord, make } from 'store/analytics/actions'
import { Name, CreatePlaylistSource } from 'services/analytics'

const messages = {
  createPlaylist: 'Create a New Playlist'
}

type OwnProps = {
  onClick?: () => void
}

type NewPlaylistButtonProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const NewPlaylistButton = ({ open, onClick }: NewPlaylistButtonProps) => {
  const record = useRecord()

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else {
      open()
    }
    record(
      make(Name.PLAYLIST_OPEN_CREATE, {
        source: CreatePlaylistSource.FAVORITES_PAGE
      })
    )
  }, [open, onClick, record])

  return (
    <button className={styles.button} onClick={handleClick}>
      {messages.createPlaylist}
    </button>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    open: () => dispatch(createPlaylistActions.open())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewPlaylistButton)
