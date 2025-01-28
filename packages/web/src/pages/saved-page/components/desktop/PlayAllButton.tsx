import { useCallback } from 'react'

import { Name, PlaybackSource, Status } from '@audius/common/models'
import { getSavedTracksLineup } from '@audius/common/src/store/pages/saved-page/selectors'
import {
  SavedPageTabs,
  savedPageTracksLineupActions as tracksActions,
  queueSelectors,
  playerSelectors
} from '@audius/common/store'
import { Button, IconPause, IconPlay } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './SavedPage.module.css'

const { makeGetCurrent } = queueSelectors
const { getPlaying } = playerSelectors

type PlayAllButtonProps = {
  currentTab: SavedPageTabs
}

export const PlayAllButton = ({ currentTab }: PlayAllButtonProps) => {
  const dispatch = useDispatch()
  const currentQueueItem = useSelector(makeGetCurrent())
  const playing = useSelector(getPlaying)
  const isQueued = Boolean(currentQueueItem)
  const trackId = currentQueueItem?.track?.track_id
  const queuedAndPlaying = playing && isQueued

  const isActive = useSelector((state) => {
    const { entries, status } = getSavedTracksLineup(state)
    return (
      currentTab === SavedPageTabs.TRACKS &&
      entries.length > 0 &&
      status === Status.SUCCESS
    )
  })

  const handleClick = useCallback(() => {
    if (playing && isQueued) {
      dispatch(tracksActions.pause())
      dispatch(
        make(Name.PLAYBACK_PAUSE, {
          id: `${trackId}`,
          source: PlaybackSource.LIBRARY_PAGE
        })
      )
    } else if (!playing && isQueued) {
      dispatch(tracksActions.play())
      dispatch(
        make(Name.PLAYBACK_PLAY, {
          id: `${trackId}`,
          source: PlaybackSource.LIBRARY_PAGE
        })
      )
    }
  }, [dispatch, playing, isQueued, trackId])

  return (
    <div
      className={styles.playButtonContainer}
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      <Button
        variant='primary'
        size='small'
        css={(theme) => ({ marginLeft: theme.spacing.xl })}
        iconLeft={queuedAndPlaying ? IconPause : IconPlay}
        onClick={handleClick}
      >
        {queuedAndPlaying ? 'Pause' : 'Play'}
      </Button>
    </div>
  )
}
