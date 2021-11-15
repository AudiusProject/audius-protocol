import React from 'react'

import cn from 'classnames'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { getIsOpen } from 'common/store/ui/add-to-playlist/selectors'
import NowPlayingDrawer from 'containers/now-playing/NowPlayingDrawer'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { getUid as getPlayingUid } from 'store/player/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import styles from './PlayBarProvider.module.css'
import DesktopPlayBar from './desktop/PlayBar'

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
