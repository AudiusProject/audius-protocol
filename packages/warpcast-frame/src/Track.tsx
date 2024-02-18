import { useParams, useSearchParams } from 'react-router-dom'
import { ENVIRONMENT_QUERY_PARAM } from './constants'

const Track = () => {
  const { trackName } = useParams()
  let [searchParams, _] = useSearchParams()
  const environment = searchParams.get(ENVIRONMENT_QUERY_PARAM) || 'prod'
  return (
    <div>
      track page for track '{trackName}' on env '{environment}'
    </div>
  )
}

export default Track
