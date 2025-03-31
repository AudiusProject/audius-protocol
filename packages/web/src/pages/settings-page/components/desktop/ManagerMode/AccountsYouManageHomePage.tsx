import { useCallback } from 'react'

import { useGetManagedAccounts } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, Divider, Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'

import { ManagedUserListItem } from './AccountListItem/ManagedUserListItem'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'
import { usePendingInviteValidator } from './usePendingInviteValidator'
const { getUserId } = accountSelectors

const messages = {
  takeControl:
    'Take control of your managed accounts by making changes to their profiles, preferences, and content.',
  noAccounts: 'You don’t manage any accounts.',
  invalidInvitation: 'This invitation is no longer valid',
  alreadyAcceptedInvitation: 'You already accepted this invitation'
}

export const AccountsYouManageHomePage = ({
  setPageState
}: AccountsYouManagePageProps) => {
  const userId = useSelector(getUserId)
  const { data: managedAccounts, status } = useGetManagedAccounts(
    { userId: userId! },
    // Always update managed accounts list when mounting this page
    { disabled: userId == null, force: true }
  )
  // Don't flash loading spinner if we are refreshing the cache
  const isLoading =
    status !== Status.SUCCESS &&
    (!managedAccounts || managedAccounts.length === 0)

  usePendingInviteValidator({
    managedAccounts,
    userId: userId ?? undefined
  })

  const handleStopManaging = useCallback(
    ({ userId }: { userId: number; managerUserId: number }) => {
      setPageState({
        page: AccountsYouManagePages.STOP_MANAGING,
        params: { user_id: userId }
      })
    },
    [setPageState]
  )

  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body' size='l'>
        {messages.takeControl}{' '}
      </Text>
      {isLoading ? (
        <Box pv='2xl'>
          <LoadingSpinner
            css={({ spacing }) => ({
              width: spacing['3xl'],
              margin: '0 auto'
            })}
          />
        </Box>
      ) : null}
      {status === Status.SUCCESS &&
      (!managedAccounts || managedAccounts.length === 0) ? (
        <>
          <Divider />
          <Text variant='body' size='l'>
            {messages.noAccounts}
          </Text>
        </>
      ) : null}
      {managedAccounts?.map((data) => {
        return (
          <ManagedUserListItem
            key={data.user.user_id}
            userData={data}
            onRemoveManager={handleStopManaging}
          />
        )
      })}
    </Flex>
  )
}
