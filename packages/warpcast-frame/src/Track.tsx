import { useParams, useSearchParams } from 'react-router-dom'
import { ENVIRONMENT_QUERY_PARAM } from './constants'
import { getTrack } from './sdk'
import { Button } from '@audius/harmony'

const Track = () => {
  //v1/full/tracks?handle=kissinginlove&slug=entrance&user_id=1PqKz
  const { handle, slug } = useParams()
  let [searchParams, _] = useSearchParams()
  const environment = searchParams.get(ENVIRONMENT_QUERY_PARAM) || 'prod'
  if (slug === undefined || handle === undefined)
    throw new Error('slug and handle are required in track route')
  const { track, error, loading } = getTrack(environment, handle, slug)
  return (
    <>
      {loading && <>loading...</>}
      {!loading && (
        <>
          <div>
            track page for '{track?.data?.title}' on env '{environment}'
          </div>
          <Button>Sup!!</Button>
        </>
      )}
    </>
  )
}

export default Track
