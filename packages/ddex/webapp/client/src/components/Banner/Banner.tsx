import { Text, Button, Box, Flex } from '@audius/harmony'

import { useAudiusSdk } from 'providers/AudiusSdkProvider'
import type { AuthedUser } from 'providers/AuthProvider'
import { useAuth } from 'providers/AuthProvider'

import styles from './Banner.module.css'

const ManageAudiusAccount = ({
  currentUser,
  isAdmin,
  onChangeUser,
  oauthError
}: {
  currentUser: AuthedUser
  isAdmin: boolean
  onChangeUser: () => void
  oauthError: string | null
}) => {
  return (
    <Flex justifyContent='space-between' alignItems='center'>
      <Flex gap='m' alignItems='center'>
        <Text
          variant='body'
          color='default'
        >{`Logged in as @${currentUser.handle}`}</Text>
        {isAdmin && (
          <Text variant='label' color='subdued' className={styles.adminBadge}>
            ADMIN
          </Text>
        )}
      </Flex>
      <Button variant='secondary' onClick={onChangeUser}>
        Switch users
      </Button>
      {oauthError && <div className='text-red-600'>{oauthError}</div>}
    </Flex>
  )
}

export const Banner = () => {
  const { audiusSdk, oauthError } = useAudiusSdk()
  const { user } = useAuth()

  if (!user) return null

  return (
    <Box p='xl'>
      <ManageAudiusAccount
        currentUser={user}
        isAdmin={user.isAdmin}
        onChangeUser={() => audiusSdk!.oauth!.login({ scope: 'write' })}
        oauthError={oauthError}
      />
    </Box>
  )
}
