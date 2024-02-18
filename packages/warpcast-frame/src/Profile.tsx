import { useParams, useSearchParams } from 'react-router-dom'
import { ENVIRONMENT_QUERY_PARAM } from './constants'
import { getUser } from './sdk'

const Profile = () => {
  const { handle } = useParams()
  let [searchParams, _] = useSearchParams()
  const environment = searchParams.get(ENVIRONMENT_QUERY_PARAM) || 'prod'
  if (handle === undefined) throw new Error('handle required in profile route')
  const { user, error, loading } = getUser(environment, handle)
  return (
    <>
      {loading && <>loading...</>}
      {!loading && (
        <>
          <div>
            profile page for '{user?.data?.name}' on env '{environment}'
          </div>
        </>
      )}
    </>
  )
}

export default Profile
