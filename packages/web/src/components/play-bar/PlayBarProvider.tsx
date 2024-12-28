import { modalsSelectors, playerSelectors } from '@audius/common/store'
import cn from 'classnames'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'utils/withRouter'

import NowPlayingDrawer from 'components/now-playing/NowPlayingDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'

import styles from './PlayBarProvider.module.css'
import DesktopPlayBar from './desktop/PlayBar'
const { getCollectible, getUid: getPlayingUid } = playerSelectors
const { getModalVisibility } = modalsSelectors

type OwnProps = {
  isMobile: boolean
}

type PlayBarProviderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps

const PlayBarProvider = ({
  playingUid,
  collectible,
  addToCollectionOpen
}: PlayBarProviderProps) => {
  const isMobile = useIsMobile()
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
          <DesktopPlayBar />
        </>
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    playingUid: getPlayingUid(state),
    collectible: getCollectible(state),
    addToCollectionOpen: getModalVisibility(state, 'AddToCollection')
  }
}

export default withRouter(connect(mapStateToProps)(PlayBarProvider))
