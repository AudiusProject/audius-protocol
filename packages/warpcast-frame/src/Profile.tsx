import { useParams, useSearchParams } from 'react-router-dom'
import { ENVIRONMENT_QUERY_PARAM } from './constants'

const Profile = () => {
  const { handle } = useParams()
  let [searchParams, _] = useSearchParams()
  const environment = searchParams.get(ENVIRONMENT_QUERY_PARAM) || 'prod'
  return (
    <div>
      profile page for '{handle}' on env '{environment}'
    </div>
  )
}

export default Profile
