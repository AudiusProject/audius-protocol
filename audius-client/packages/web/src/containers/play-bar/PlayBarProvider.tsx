import React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import cn from 'classnames'

import NowPlayingDrawer from 'containers/now-playing/NowPlayingDrawer'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'
import DesktopPlayBar from './desktop/PlayBar'
import { getUid as getPlayingUid } from 'store/player/selectors'
import styles from './PlayBarProvider.module.css'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { getIsOpen } from 'containers/add-to-playlist/store/selectors'

type OwnProps = {
  isMobile: boolean
}

type PlayBarProviderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps

const PlayBarProvider = ({
  isMobile,
  playingUid,
  keyboardVisible,
  addToPlaylistOpen
}: PlayBarProviderProps) => {
  return (
    <div
      className={cn(styles.playBarWrapper, {
        [styles.isMobile]: isMobile
      })}
    >
      {isMobile ? (
        <NowPlayingDrawer
          isPlaying={!!playingUid}
          keyboardVisible={keyboardVisible}
          shouldClose={addToPlaylistOpen}
        />
      ) : (
        <>
          <div className={styles.customHr} />
          <DesktopPlayBar />
        </>
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    playingUid: getPlayingUid(state),
    isMobile: isMobile(),
    keyboardVisible: getKeyboardVisibility(state),
    addToPlaylistOpen: getIsOpen(state)
  }
}

export default withRouter(connect(mapStateToProps)(PlayBarProvider))
