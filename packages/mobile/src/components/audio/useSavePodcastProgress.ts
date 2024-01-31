import { useEffect } from 'react'

import {
  accountSelectors,
  cacheTracksSelectors,
  playerSelectors,
  playbackPositionActions
} from '@audius/common/store'
import { Genre } from '@audius/common/utils'
import { useProgress } from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'

const { getPlaying, getTrackId } = playerSelectors
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors
const { setTrackPosition } = playbackPositionActions

export const useSavePodcastProgress = () => {
  const { position } = useProgress()
  const dispatch = useDispatch()

  const isPlayingLongFormContent = useSelector((state) => {
    const trackId = getTrackId(state)
    const track = getTrack(state, { id: trackId })
    if (!track) return false
    const isLongFormContent = [Genre.PODCASTS, Genre.AUDIOBOOKS].includes(
      track.genre as Genre
    )
    const isPlaying = getPlaying(state)

    return isLongFormContent && isPlaying
  })

  const userId = useSelector(getUserId)
  const trackId = useSelector(getTrackId)

  useEffect(() => {
    if (isPlayingLongFormContent && userId && trackId) {
      dispatch(
        setTrackPosition({
          userId,
          trackId,
          positionInfo: { status: 'IN_PROGRESS', playbackPosition: position }
        })
      )
    }
  }, [position, isPlayingLongFormContent, userId, trackId, dispatch])
}
