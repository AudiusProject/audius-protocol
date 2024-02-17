import { Navigate, useOutlet } from 'react-router-dom'

import { useAuth } from 'providers/AuthProvider'

// Layout for routes that don't require authentication
const PublicLayout = () => {
  const { user } = useAuth()
  const outlet = useOutlet()

  // The only thing we show to non-authed users is the login page
  if (!user && location.pathname !== '/login') {
    return <Navigate to='/login' replace />
  }

  // If the user is authed, redirect them to the appropriate page
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
