import { useParams } from 'react-router-dom'

export function PlaylistDetail() {
  const { handle, playlist } = useParams()
  return (
    <div>
      <h1>
        playlist detaillll: {handle} {playlist}
      </h1>
    </div>
  )
}
