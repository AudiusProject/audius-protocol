import { Navigate, useOutlet } from 'react-router-dom'

import { useAuth } from 'providers/AuthProvider'

const PublicLayout = () => {
  const { user } = useAuth()
  const outlet = useOutlet()

  if (!user && location.pathname !== '/login') {
    return <Navigate to='/login' replace />
  }

  if (user) {
    if (user.isAdmin) {
      return <Navigate to='/admin' replace />
    } else if (user.isArtist) {
      return <Navigate to='/artist' replace />
    } else {
      return <Navigate to='/not-allowlisted' replace />
    }
  }

  return <div>{outlet}</div>
}

export default PublicLayout
