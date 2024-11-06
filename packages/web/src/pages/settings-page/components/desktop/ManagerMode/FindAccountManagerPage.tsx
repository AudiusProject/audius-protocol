import { useCallback, useMemo, useState } from 'react'

import { useGetManagers } from '@audius/common/api'
import { User } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, Flex, IconShieldUser, Text } from '@audius/harmony'

import ArtistChip from 'components/artist/ArtistChip'
import { UsersSearch } from 'components/search-users-modal/SearchUsersModal'
import { useSelector } from 'utils/reducer'

import { sharedMessages } from './sharedMessages'
import { AccountsManagingYouPages, FindAccountManagerPageProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  description: 'Invite a manager to join your account.',
  searchUsers: 'Search Users',
  searchForManager: 'Search for Account Manager',
  accessWarning: 'Only grant manager access to people you trust.'
}

export const FindAccountManagerPage = (props: FindAccountManagerPageProps) => {
  const { setPageState, params } = props
  const [query, setQuery] = useState(params?.query ?? '')
  const userId = useSelector(getUserId)
  const { data: managers } = useGetManagers(
    { userId: userId! },
    { disabled: userId == null }
  )
  const excludedUserIds = useMemo(() => {
    const res: number[] = managers?.map((m) => m.manager.user_id) ?? []
    if (userId) {
      res.push(userId)
    }
    return res
  }, [managers, userId])

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
              setPageState({
                page: AccountsManagingYouPages.CONFIRM_NEW_MANAGER,
                params: {
                  user,
                  query
                }
              })
            }}
          />
        </Box>
      )
    },
    [query, setPageState]
  )

  return (
    <Flex direction='column' gap='xl'>
      <Box ph='xl'>
        <Text variant='body' size='l'>
          {messages.description} {sharedMessages.accountManagersExplanation}{' '}
        </Text>
      </Box>
      <UsersSearch
        excludedUserIds={excludedUserIds}
        query={query}
        onChange={setQuery}
        disableAutofocus
        renderUser={renderUser}
        renderEmpty={renderEmpty}
      />
    </Flex>
  )
}
