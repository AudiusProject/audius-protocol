import { ManagedUserMetadata, User } from '@audius/common/models'
import { Box, Flex, IconUserGroup, Text, useTheme } from '@audius/harmony'
import styled from '@emotion/styled'
import { AccountSwitcherRow } from './AccountSwitcherRow'

const messages = {
  switchAccount: 'Switch Account',
  maangedAccounts: 'Managed Accounts'
}

export type AccountListContentProps = {
  accounts: ManagedUserMetadata[]
  managerAccount: User
}

const StyledList = styled.ul`
  all: unset;
  list-style: none;
`

export const AccountListContent = ({
  accounts,
  managerAccount
}: AccountListContentProps) => {
  const theme = useTheme()
  // TODO: aria-labels
  return (
    <Flex
      direction='column'
      w={360}
      borderRadius='s'
      border='strong'
      backgroundColor='white'
    >
      <Flex
        backgroundColor='white'
        borderBottom='default'
        alignItems='center'
        justifyContent='flex-start'
        ph='l'
        pv='s'
        gap='s'
      >
        <IconUserGroup size='s' color='default' />
        <Text variant='title' size='m' color='default'>
          {messages.switchAccount}
        </Text>
      </Flex>
      <StyledList role='menu' tabIndex={-1}>
        <li role='menuitem' tabIndex={0}>
          <AccountSwitcherRow user={managerAccount} isSelected />
        </li>
        <Box
          ph='l'
          pv='s'
          backgroundColor='surface1'
          borderTop='default'
          borderBottom='default'
        >
          <Text variant='title' size='xs' color='default'>
            {messages.maangedAccounts}
          </Text>
        </Box>

        {accounts.map(({ user }, i) => (
          <li
            key={user.user_id}
            role='menuitem'
            onClick={() => console.log(`clicked ${user.user_id}`)}
            tabIndex={-1}
          >
            <Box borderBottom={i < accounts.length - 1 ? 'default' : undefined}>
              <AccountSwitcherRow user={user} />
            </Box>
          </li>
        ))}
      </StyledList>
    </Flex>
  )
}

// Make ticket for migrating follows you thing
// Talk about in meeting about how to hide high level pages
