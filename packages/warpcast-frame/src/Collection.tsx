import { useParams, useSearchParams } from 'react-router-dom'
import { ENVIRONMENT_QUERY_PARAM } from './constants'

const Collection = () => {
  const { collectionName } = useParams()
  let [searchParams, _] = useSearchParams()
  const environment = searchParams.get(ENVIRONMENT_QUERY_PARAM) || 'prod'
  return (
    <div>
      collection page for collection '{collectionName}' on env '{environment}'
    </div>
  )
}

export default Collection
