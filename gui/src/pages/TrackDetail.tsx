import { useParams } from 'react-router-dom'

export function TrackDetail() {
  const { handle, track } = useParams()
  return (
    <div>
      <h1>
        track detaillll: {handle} {track}
      </h1>
    </div>
  )
}
