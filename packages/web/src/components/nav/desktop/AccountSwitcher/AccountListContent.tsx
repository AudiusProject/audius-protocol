import { useCallback, useMemo } from 'react'

import { ID, ManagedUserMetadata, UserMetadata } from '@audius/common/models'
import { Box, Flex, IconUserArrowRotate, Text } from '@audius/harmony'
import styled from '@emotion/styled'

import { AccountSwitcherRow } from './AccountSwitcherRow'

const messages = {
  switchAccount: 'Switch Account',
  managedAccounts: 'Managed Accounts'
}

export type AccountListContentProps = {
  accounts: ManagedUserMetadata[]
  managerAccount: UserMetadata
  currentUserId: ID
  onAccountSelected: (user: UserMetadata) => void
}

const StyledList = styled.ul`
  all: unset;
  list-style: none;
`

export const AccountListContent = ({
  accounts,
  managerAccount,
  currentUserId,
  onAccountSelected
}: AccountListContentProps) => {
  // If the current user is one of the managed account, sort it to the top of
  // the list
  const sortedAccounts = useMemo(() => {
    const selectedIdx = accounts.findIndex(
      ({ user }) => user.user_id === currentUserId
    )
    if (selectedIdx === -1) return accounts
    const withoutSelected = [...accounts]
    const selectedAccount = withoutSelected.splice(selectedIdx, 1)[0]
    return [selectedAccount, ...withoutSelected]
  }, [accounts, currentUserId])

  const onUserSelected = useCallback(
    (user: UserMetadata) => {
      if (user.user_id !== currentUserId) {
        onAccountSelected(user)
      }
    },
    [currentUserId, onAccountSelected]
  )
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
        <IconUserArrowRotate size='s' color='default' />
        <Text variant='title' size='m' color='default'>
          {messages.switchAccount}
        </Text>
      </Flex>
      <StyledList role='menu' tabIndex={-1}>
        <li
          role='menuitem'
          tabIndex={0}
          onClick={() => onUserSelected(managerAccount)}
        >
          <AccountSwitcherRow
            user={managerAccount}
            isSelected={currentUserId === managerAccount.user_id}
          />
        </li>
        <Box
          ph='l'
          pv='s'
          backgroundColor='surface1'
          borderTop='default'
          borderBottom='default'
        >
          <Text variant='title' size='xs' color='default'>
            {messages.managedAccounts}
          </Text>
        </Box>

        {sortedAccounts.map(({ user }, i) => (
          <li
            key={user.user_id}
            role='menuitem'
            onClick={() => onUserSelected(user)}
            tabIndex={-1}
          >
            <Box borderBottom={i < accounts.length - 1 ? 'default' : undefined}>
              <AccountSwitcherRow
                user={user}
                isSelected={currentUserId === user.user_id}
              />
            </Box>
          </li>
        ))}
      </StyledList>
    </Flex>
  )
}
