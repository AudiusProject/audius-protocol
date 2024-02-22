import { Flex, Box } from '@audius/harmony'
import { Navigate, useOutlet } from 'react-router-dom'

import { useAuth } from 'providers/AuthProvider'

import AdminNavSidebar from './AdminNavSidebar'
import { Banner } from './Banner/Banner'

// Layout for routes that require authentication
const AuthedLayout = ({ isAdmin = false }) => {
  const { user } = useAuth()
  const outlet = useOutlet()

  // If the user is not authed, or if a non-admin is viewing an admin page, redirect to the login page
  if (!user || (isAdmin && !user.isAdmin)) {
    return <Navigate to='/login' replace />
  }

  // If the user is authed as an admin but on an artist route, redirect to the admin route
  if (user.isAdmin && !isAdmin) {
    return <Navigate to='/admin' replace />
  }

  return (
    <Flex>
      {isAdmin && <AdminNavSidebar />}
      <div style={{ flexGrow: '5' }}>
        <Flex direction='column'>
          <Banner />
          <Box
            p='xl'
            backgroundColor='surface2'
            borderTop='strong'
            style={{ height: '100vh' }}
          >
            {outlet}
          </Box>
        </Flex>
      </div>
    </Flex>
  )
}

export default AuthedLayout
