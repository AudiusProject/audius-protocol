import { useCurrentCommentSection } from '@audius/common/context'
import { seek } from '@audius/common/src/store/player/slice'
import { TextLink, formatTrackTimestamp } from '@audius/harmony'
import { useDispatch } from 'react-redux'

export const TimestampLink = ({
  trackTimestampS
}: {
  trackTimestampS: number
}) => {
  const dispatch = useDispatch()
  const { playTrack } = useCurrentCommentSection()
  const handleClick = () => {
    // Starts playing the current page's song
    playTrack()
    // Seeks to the timestamp
    dispatch(seek({ seconds: trackTimestampS }))
  }
  return (
    <TextLink size='s' variant='active' onClick={handleClick}>
      {formatTrackTimestamp(trackTimestampS)}
    </TextLink>
  )
}
