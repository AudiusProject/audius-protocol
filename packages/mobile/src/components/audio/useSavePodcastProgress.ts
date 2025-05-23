import { useEffect } from 'react'

import { useTrack } from '@audius/common/api'
import {
  accountSelectors,
  playerSelectors,
  playbackPositionActions
} from '@audius/common/store'
import { isLongFormContent } from '@audius/common/utils'
import { useProgress } from 'react-native-track-player'
import { useDispatch, useSelector } from 'react-redux'

const { getPlaying, getTrackId } = playerSelectors
const { getUserId } = accountSelectors
const { setTrackPosition } = playbackPositionActions

export const useSavePodcastProgress = () => {
  const { position } = useProgress()
  const dispatch = useDispatch()

  const userId = useSelector(getUserId)
  const trackId = useSelector(getTrackId)
  const isPlaying = useSelector(getPlaying)
  const { data: isTrackLongFormContent } = useTrack(trackId, {
    select: (data) => isLongFormContent(data)
  })
  const isPlayingLongFormContent = isTrackLongFormContent && isPlaying

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
