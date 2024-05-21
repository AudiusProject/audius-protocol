import { useCallback, useContext, useEffect } from 'react'

import {
  useApproveManagedAccount,
  useGetManagedAccounts,
  useRemoveManager
} from '@audius/common/api'
import { Status, UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, Divider, Flex, Text, TextLink } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'
import { useSelector } from 'utils/reducer'

import { AccountListItem } from './AccountListItem'
import { sharedMessages } from './sharedMessages'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'
const { getUserId } = accountSelectors

const messages = {
  takeControl:
    'Take control of your managed accounts by making changes to their profiles, preferences, and content.',
  noAccounts: 'You don’t manage any accounts.'
}

export const AccountsYouManageHomePage = ({
  setPage
}: AccountsYouManagePageProps) => {
  const userId = useSelector(getUserId)
  const { data: managedAccounts, status } = useGetManagedAccounts(
    { userId: userId! },
    { disabled: userId == null }
  )
  const [approveManagedAccount, approveResult] = useApproveManagedAccount()
  const [rejectManagedAccount, rejectResult] = useRemoveManager()
  const { toast } = useContext(ToastContext)

  const handleStopManaging = useCallback(
    ({ userId }: { userId: number; managerUserId: number }) => {
      setPage(AccountsYouManagePages.STOP_MANAGING, { user_id: userId })
    },
    [setPage]
  )

  const handleApprove = useCallback(
    ({
      currentUserId,
      grantorUser
    }: {
      currentUserId: number
      grantorUser: UserMetadata
    }) => {
      approveManagedAccount({ userId: currentUserId, grantorUser })
    },
    [approveManagedAccount]
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
        <TextLink isExternal href='#' variant='visible'>
          {sharedMessages.learnMore}
        </TextLink>
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
