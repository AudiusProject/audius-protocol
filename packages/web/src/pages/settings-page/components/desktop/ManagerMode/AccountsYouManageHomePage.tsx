import { useCallback, useContext, useEffect } from 'react'

import {
  useApproveManagedAccount,
  useGetManagedAccounts,
  useRemoveManager
} from '@audius/common/api'
import { Status, UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, Divider, Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'
import { useSelector } from 'utils/reducer'

import { AccountListItem } from './AccountListItem'
import { sharedMessages } from './sharedMessages'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'
import { usePendingInviteValidator } from './usePendingInviteValidator'
const { getAccountUser } = accountSelectors

const messages = {
  takeControl:
    'Take control of your managed accounts by making changes to their profiles, preferences, and content.',
  noAccounts: 'You don’t manage any accounts.',
  invalidInvitation: 'This invitation is no longer valid',
  alreadyAcceptedInvitation: 'You already accepted this invitation'
}

export const AccountsYouManageHomePage = ({
  setPage
}: AccountsYouManagePageProps) => {
  const currentUser = useSelector(getAccountUser)
  const userId = currentUser?.user_id
  const { data: managedAccounts, status } = useGetManagedAccounts(
    { userId: userId! },
    // Always update managed accounts list when mounting this page
    // TODO: This pattern causes a flash on both modals, maybe update it to SWR-style
    { disabled: userId == null, force: true }
  )
  const [approveManagedAccount, approveResult] = useApproveManagedAccount()
  const [rejectManagedAccount, rejectResult] = useRemoveManager()
  const { toast } = useContext(ToastContext)

  usePendingInviteValidator({ managedAccounts, userId })

  const handleStopManaging = useCallback(
    ({ userId }: { userId: number; managerUserId: number }) => {
      setPage(AccountsYouManagePages.STOP_MANAGING, { user_id: userId })
    },
    [setPage]
  )

  const handleApprove = useCallback(
    ({ grantorUser }: { grantorUser: UserMetadata }) => {
      if (currentUser) {
        approveManagedAccount({
          userId: currentUser.user_id,
          grantorUser,
          userWalletAddress: currentUser.erc_wallet
        })
      }
    },
    [approveManagedAccount, currentUser]
  )

  const handleReject = useCallback(
    ({
      currentUserId,
      grantorUser
    }: {
      currentUserId: number
      grantorUser: UserMetadata
    }) => {
      rejectManagedAccount({
        userId: grantorUser.user_id,
        managerUserId: currentUserId
      })
    },
    [rejectManagedAccount]
  )

  useEffect(() => {
    if (approveResult.status === Status.ERROR) {
      toast(sharedMessages.somethingWentWrong)
    }
  }, [toast, approveResult.status])

  useEffect(() => {
    if (rejectResult.status === Status.ERROR) {
      toast(sharedMessages.somethingWentWrong)
    }
  }, [toast, rejectResult.status])

  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body' size='l'>
        {messages.takeControl}{' '}
      </Text>
      {status !== Status.SUCCESS ? (
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
      {managedAccounts?.map((m) => {
        return (
          <AccountListItem
            key={m.user.user_id}
            user={m.user}
            onRemoveManager={handleStopManaging}
            onApprove={handleApprove}
            onReject={handleReject}
            isManagedAccount
            isPending={m.grant.is_approved == null}
          />
        )
      })}
    </Flex>
  )
}
