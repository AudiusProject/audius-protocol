import { useCurrentCommentSection } from '@audius/common/context'
import { seek } from '@audius/common/src/store/player/slice'
import { TextLink, formatTrackTimestamp } from '@audius/harmony'
import { useDispatch } from 'react-redux'

export const TimestampLink = ({ timestampMS }: { timestampMS: number }) => {
  const dispatch = useDispatch()
  const { playTrack } = useCurrentCommentSection()
  const timestampS = Math.floor(timestampMS / 1000)
  const handleClick = () => {
    // Starts playing the current page's song
    playTrack()
    // Seeks to the timestamp
    dispatch(seek({ seconds: timestampS }))
  }
  return (
    <TextLink size='s' variant='active' onClick={handleClick}>
      {formatTrackTimestamp(timestampS)}
    </TextLink>
  )
}
