import { useCallback, useState } from 'react'

import { User } from '@audius/common/models'
import { Box, Flex, IconShieldUser, Text, TextLink } from '@audius/harmony'

import ArtistChip from 'components/artist/ArtistChip'
import { UsersSearch } from 'components/search-users-modal/SearchUsersModal'

import { sharedMessages } from './sharedMessages'
import { AccountsManagingYouPages, FindAccountManagerPageProps } from './types'

const messages = {
  description: 'Invite a manager to join your account.',
  searchUsers: 'Search Users',
  searchForManager: 'Search for Account Manager',
  accessWarning: 'Only grant manager access to people you trust.'
}

export const FindAccountManagerPage = (props: FindAccountManagerPageProps) => {
  const { setPage, params } = props
  const [query, setQuery] = useState(params?.query ?? '')

  const renderEmpty = useCallback(() => {
    return (
      <Flex direction='column' gap='l' alignItems='center' mt='xl' h='100%'>
        <IconShieldUser color='subdued' size='3xl' />
        <Text variant='heading' size='s'>
          {messages.searchForManager}
        </Text>
        <Text variant='body' size='l'>
          {messages.accessWarning}
        </Text>
      </Flex>
    )
  }, [])

  const renderUser = useCallback(
    (user: User) => {
      return (
        <Box
          key={user.user_id}
          pv='l'
          borderTop='default'
          ph='xl'
          css={(theme) => ({
            '&:hover': {
              cursor: 'pointer',
              backgroundColor: theme.color.background.surface1
            }
          })}
        >
          <ArtistChip
            user={user as any}
            showPopover={false}
            onClickArtistName={() => {
              setPage(AccountsManagingYouPages.CONFIRM_NEW_MANAGER, {
                user,
                query
              })
            }}
          />
        </Box>
      )
    },
    [query, setPage]
  )

  return (
    <Flex direction='column' gap='xl'>
      <Box ph='xl'>
        <Text variant='body' size='l'>
          {messages.description} {sharedMessages.accountManagersExplanation}{' '}
          <TextLink href='#' variant='visible'>
            {sharedMessages.learnMore}
          </TextLink>
        </Text>
      </Box>
      <UsersSearch
        query={query}
        onChange={setQuery}
        disableAutofocus
        renderUser={renderUser}
        renderEmpty={renderEmpty}
      />
    </Flex>
  )
}
