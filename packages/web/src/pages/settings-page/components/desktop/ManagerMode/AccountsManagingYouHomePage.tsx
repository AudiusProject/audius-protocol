import { accountSelectors } from '@audius/common/store'

import { Button, Flex, IconPlus, Text, TextLink } from '@audius/harmony'

import { Divider } from '@audius/harmony'

import { AccountsManagingYouPageProps, AccountsManagingYouPages } from './types'
import { AccountListItem } from './AccountListItem'
import { sharedMessages } from './sharedMessages'

const { getUserId } = accountSelectors

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
        {/* TODO(nkang - C-4315 ) - Fetch real data */}
        {/* Empty state */}
        {/* <Text variant='body' size='l'>
          {messages.noManagers}
        </Text> */}
        <AccountListItem />
      </Flex>
    </Flex>
  )
}
