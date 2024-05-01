import { useCallback, useContext, useEffect } from 'react'

import {
  useApproveManagedAccount,
  useGetManagedAccounts,
  useRejectManagedAccount
} from '@audius/common/api'
import { Status, UserMetadata } from '@audius/common/models'
import {
  Box,
  Divider,
  Flex,
  IconUserArrowRotate,
  Modal,
  ModalContent,
  ModalHeader,
  ModalProps,
  ModalTitle,
  Text,
  TextLink
} from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'

import { AccountListItem } from './AccountListItem'
import { sharedMessages } from './sharedMessages'

const messages = {
  accountsYouManage: 'Accounts You Manage',
  takeControl:
    'Take control of your managed accounts by making changes to their profiles, preferences, and content.',
  noAccounts: 'You don’t manage any accounts.',
  somethingWentWrong: 'Something went wrong. Please try again later.'
}

type AccountsManagingYouSettingsModalProps = Omit<ModalProps, 'children'>

export const AccountsYouManageSettingsModal = (
  props: AccountsManagingYouSettingsModalProps
) => {
  const { data: managedAccounts, status } = useGetManagedAccounts({})
  const [approveManagedAccount, approveResult] = useApproveManagedAccount()
  const [rejectManagedAccount, rejectResult] = useRejectManagedAccount()
  const { toast } = useContext(ToastContext)

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
      rejectManagedAccount({ userId: currentUserId, grantorUser })
    },
    [rejectManagedAccount]
  )

  useEffect(() => {
    if (
      approveResult.status === Status.ERROR ||
      rejectResult.status === Status.ERROR
    ) {
      toast(messages.somethingWentWrong)
    }
  }, [toast, approveResult.status, rejectResult.status])

  return (
    <>
      <Modal {...props} size='small'>
        <ModalHeader>
          <ModalTitle
            title={messages.accountsYouManage}
            icon={<IconUserArrowRotate />}
          />
        </ModalHeader>
        <ModalContent>
          <Flex direction='column' gap='xl'>
            <Text variant='body' size='l'>
              {messages.takeControl}{' '}
              <TextLink href='#' variant='visible'>
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
                <Box>
                  <Text variant='body' size='l'>
                    {messages.noAccounts}
                  </Text>
                </Box>
              </>
            ) : null}
            {managedAccounts?.map((m) => {
              return (
                <AccountListItem
                  key={m.user.user_id}
                  user={m.user}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isManagedAccount
                  isPending={m.grant.is_approved == null}
                />
              )
            })}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  )
}
