import { Flex, Box } from '@audius/harmony'
import { Navigate, useOutlet } from 'react-router-dom'

import { useAuth } from 'providers/AuthProvider'

import AdminNavSidebar from './AdminNavSidebar'
import { Banner } from './Banner/Banner'

const AuthedLayout = ({
  userType
}: {
  userType: 'admin' | 'artist' | 'not-allowlisted'
}) => {
  const { user } = useAuth()
  const outlet = useOutlet()

  if (
    userType === 'not-allowlisted' &&
    user &&
    (user.isAdmin || user.isArtist)
  ) {
    return <Navigate to='/' />
  }

  if (
    !user ||
    (userType === 'admin' && !user.isAdmin) ||
    (userType === 'artist' && !user.isArtist)
  ) {
    return <Navigate to='/' />
  }

  return (
    <Flex>
      {userType === 'admin' && <AdminNavSidebar />}
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
