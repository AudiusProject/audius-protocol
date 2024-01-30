import { Text, Button, Box, Flex } from '@audius/harmony'
import type { DecodedUserToken } from '@audius/sdk/dist/sdk/index.d.ts'

import { useAudiusSdk } from 'providers/AudiusSdkProvider'

import styles from './Banner.module.css'

const ManageAudiusAccount = ({
  currentUser,
  isAdmin,
  onChangeUser,
  oauthError
}: {
  currentUser: DecodedUserToken
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
  const { audiusSdk, currentUser, isAdmin, oauthError } = useAudiusSdk()

  if (currentUser) {
    return (
      <Box p='xl'>
        <ManageAudiusAccount
          currentUser={currentUser}
          isAdmin={isAdmin}
          onChangeUser={() => audiusSdk!.oauth!.login({ scope: 'read' })}
          oauthError={oauthError}
        />
      </Box>
    )
  } else {
    return null
  }
}
