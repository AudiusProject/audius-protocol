import { useCallback } from 'react'

import { useGetManagers } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, Button, Divider, Flex, IconPlus, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'

import { ManagerListItem } from './AccountListItem/ManagerListItem'
import { sharedMessages } from './sharedMessages'
import { AccountsManagingYouPageProps, AccountsManagingYouPages } from './types'

const { getUserId } = accountSelectors

const messages = {
  accountManagers: 'Account Managers',
  noManagers: 'You haven’t added any managers to your account.',
  inviteButton: 'Invite'
}

type AccountsManagingYouHomePageProps = AccountsManagingYouPageProps

export const AccountsManagingYouHomePage = (
  props: AccountsManagingYouHomePageProps
) => {
  const { setPageState } = props
  const userId = useSelector(getUserId) as number

  // Always update manager list when mounting this page
  const { data: managers, status: managersStatus } = useGetManagers(
    { userId },
    { force: true }
  )
  // Don't flash loading spinner if we are refreshing the cache
  const isLoading =
    managersStatus !== Status.SUCCESS && (!managers || managers.length === 0)

  const handleRemoveManager = useCallback(
    (params: { userId: number; managerUserId: number }) => {
      setPageState({
        page: AccountsManagingYouPages.CONFIRM_REMOVE_MANAGER,
        params
      })
    },
    [setPageState]
  )

  return (
    <Flex direction='column' gap='xl' ph='xl'>
      <Text variant='body' size='l'>
        {sharedMessages.accountManagersExplanation}
      </Text>
      <Divider />
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' size='m'>
          {messages.accountManagers}
        </Text>
        <Button
          variant='secondary'
          iconLeft={IconPlus}
          onClick={() =>
            setPageState({
              page: AccountsManagingYouPages.FIND_ACCOUNT_MANAGER
            })
          }
        >
          {messages.inviteButton}
        </Button>
      </Flex>
      <Flex direction='column' gap='s'>
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
        {managersStatus === Status.SUCCESS &&
        (!managers || managers.length === 0) ? (
          <Text variant='body' size='l'>
            {messages.noManagers}
          </Text>
        ) : null}
        {managers?.map((data) => {
          return (
            <ManagerListItem
              onRemoveManager={handleRemoveManager}
              key={data.manager.user_id}
              managerData={data}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
