import { useToggleSaveTrack } from '@audius/common/api'
import { FavoriteSource } from '@audius/common/models'
import { modalsSelectors, playerSelectors } from '@audius/common/store'
import cn from 'classnames'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import NowPlayingDrawer from 'components/now-playing/NowPlayingDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'

import styles from './PlayBarProvider.module.css'
import DesktopPlayBar from './desktop/PlayBar'
const {
  getCollectible,
  getUid: getPlayingUid,
  getTrackId: getPlayingTrackId
} = playerSelectors
const { getModalVisibility } = modalsSelectors

type OwnProps = {
  isMobile: boolean
}

type PlayBarProviderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps

const PlayBarProvider = ({
  playingTrackId,
  playingUid,
  collectible,
  addToCollectionOpen
}: PlayBarProviderProps) => {
  const isMobile = useIsMobile()
  const toggleSaveTrack = useToggleSaveTrack({
    trackId: playingTrackId,
    source: FavoriteSource.PLAYBAR
  })

  return (
    <div
      className={cn(styles.playBarWrapper, {
        [styles.isMobile]: isMobile
      })}
    >
      {isMobile ? (
        <NowPlayingDrawer
          isPlaying={!!playingUid || !!collectible}
          shouldClose={addToCollectionOpen === true}
        />
      ) : (
        <>
          <div className={styles.customHr} />
          <DesktopPlayBar toggleSaveTrack={toggleSaveTrack} />
        </>
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    playingUid: getPlayingUid(state),
    playingTrackId: getPlayingTrackId(state),
    collectible: getCollectible(state),
    addToCollectionOpen: getModalVisibility(state, 'AddToCollection')
  }
}

export default withRouter(connect(mapStateToProps)(PlayBarProvider))
