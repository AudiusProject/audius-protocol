import { useParams } from 'react-router-dom'

const Track = () => {
  const { trackName } = useParams()
  return <div>track page for track '{trackName}'</div>
}

export default Track
