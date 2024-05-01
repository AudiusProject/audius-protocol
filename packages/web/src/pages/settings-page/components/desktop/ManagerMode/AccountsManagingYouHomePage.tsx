import { useGetManagers } from '@audius/common/api'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconPlus,
  Text,
  TextLink
} from '@audius/harmony'

import { Status } from '@audius/common/models'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { AccountListItem } from './AccountListItem'
import { sharedMessages } from './sharedMessages'
import { AccountsManagingYouPageProps, AccountsManagingYouPages } from './types'

export const messages = {
  accountManagers: 'Account Managers',
  noManagers: 'You haven’t added any managers to your account.',
  inviteButton: 'Invite'
}

type AccountsManagingYouHomePageProps = AccountsManagingYouPageProps

export const AccountsManagingYouHomePage = (
  props: AccountsManagingYouHomePageProps
) => {
  const { setPage } = props
  const { data, status } = useGetManagers({})
  const managers = data
  return (
    <Flex direction='column' gap='xl' ph='xl'>
      <Text variant='body' size='l'>
        {sharedMessages.accountManagersExplanation}{' '}
        <TextLink href='#' variant='visible'>
          {sharedMessages.learnMore}
        </TextLink>
      </Text>
      <Divider />
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' size='m'>
          {messages.accountManagers}
        </Text>
        <Button
          variant='secondary'
          iconLeft={IconPlus}
          onClick={() => setPage(AccountsManagingYouPages.FIND_ACCOUNT_MANAGER)}
        >
          {messages.inviteButton}
        </Button>
      </Flex>
      <Flex direction='column' gap='s'>
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
        {status === Status.SUCCESS && (!managers || managers.length === 0) ? (
          <Text variant='body' size='l'>
            {messages.noManagers}
          </Text>
        ) : null}
        {managers?.map(({ grant, manager }) => {
          return (
            <AccountListItem
              key={manager.user_id}
              user={manager}
              isPending={!grant.is_approved}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
