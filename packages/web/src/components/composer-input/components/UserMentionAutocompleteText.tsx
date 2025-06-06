import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

import {
  SearchCategory,
  useAccountStatus,
  useCurrentUserId,
  useFollowers,
  useSearchUserResults,
  useUsers
} from '@audius/common/api'
import { Status, UserMetadata } from '@audius/common/models'
import {
  Flex,
  LoadingSpinner,
  MenuContent,
  Menu,
  MenuItem,
  Text,
  OptionKeyHandler
} from '@audius/harmony'

import { Avatar } from 'components/avatar'
import { UserLink } from 'components/link'

const messages = {
  searchUsers: 'Search User',
  noResults: 'No Results'
}

type UserMentionAutocompleteTextProps = {
  text: string
  onConfirm?: (user: UserMetadata) => void
  onResultsLoaded?: (results: UserMetadata[]) => void
}

export const UserMentionAutocompleteText = (
  props: UserMentionAutocompleteTextProps
) => {
  const { text, onConfirm, onResultsLoaded } = props
  const anchorRef = useRef<HTMLElement>(null)
  const [isOpen, setIsOpen] = useState(true)
  const searchText = text.slice(1)
  const { data: accountStatus } = useAccountStatus()
  const { data: currentUserId } = useCurrentUserId()
  const {
    data: followerIds,
    isPending: followerDataPending,
    isSuccess: followersDataSuccess
  } = useFollowers({ pageSize: 6, userId: currentUserId })
  const { data: followers } = useUsers(followerIds)
  const optionRefs = useRef<HTMLButtonElement[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const params = {
    query: searchText,
    category: 'users' as SearchCategory,
    currentUserId,
    limit: 6,
    offset: 0,
    disableAnalytics: true
  }

  const {
    data: searchData,
    isLoading,
    isSuccess
  } = useSearchUserResults(params, {
    enabled: accountStatus !== Status.LOADING && accountStatus !== Status.IDLE
  })

  const userList = searchText !== '' ? searchData : followers
  const userListLoadSuccess =
    searchText !== '' ? isSuccess : followersDataSuccess
  const isUserListPending = searchText !== '' ? isLoading : followerDataPending

  const options = useMemo(
    () => userList?.map((user) => ({ value: String(user.user_id) })) ?? [],
    [userList]
  )

  useEffect(() => {
    if (userList && userListLoadSuccess) {
      onResultsLoaded?.(userList)
    }
  }, [userList, onResultsLoaded, searchText, userListLoadSuccess])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleChange = useCallback(
    (userId: string) => {
      const user = userList?.find((user) => user.user_id === Number(userId))
      if (user) {
        onConfirm?.(user)
      }
    },
    [userList, onConfirm]
  )

  const renderContent = () => {
    if (isUserListPending) {
      return (
        <Flex justifyContent='center' alignItems='center' p='m' w='100%'>
          <LoadingSpinner css={{ height: 32 }} />
        </Flex>
      )
    }

    if (!userList || userList.length === 0) {
      return <Text>{messages.noResults}</Text>
    }

    return (
      <OptionKeyHandler
        options={options}
        optionRefs={optionRefs}
        scrollRef={scrollRef}
        onChange={handleChange}
        initialActiveIndex={0}
      >
        {(activeValue) =>
          options.map((option, index) => {
            const { value } = option
            const userId = Number(value)
            const isActive = !activeValue ? index === 0 : activeValue === value
            return (
              <MenuItem
                variant='option'
                value={value}
                onChange={handleChange}
                ref={(el) => {
                  if (optionRefs && optionRefs.current && el) {
                    optionRefs.current[index] = el
                  }
                }}
                styles={{
                  button: { paddingLeft: 8, paddingRight: 8, height: 52 }
                }}
                key={userId}
                leadingElement={<Avatar userId={userId} h={32} w={32} />}
                isActive={isActive}
                label={
                  <Flex column alignItems='flex-start'>
                    <UserLink
                      userId={userId}
                      size='s'
                      disabled
                      variant={isActive ? 'inverted' : 'default'}
                    />
                    <Text size='xs' color={isActive ? 'white' : 'subdued'}>
                      {userList[index].handle}
                    </Text>
                  </Flex>
                }
              />
            )
          })
        }
      </OptionKeyHandler>
    )
  }

  return (
    <>
      <Text
        // @ts-ignore
        ref={anchorRef}
        css={{ whiteSpace: 'pre-wrap', pointerEvents: 'none' }}
        color='accent'
      >
        {text}
      </Text>
      <Menu anchorRef={anchorRef} isVisible={isOpen} onClose={handleClose}>
        <MenuContent
          scrollRef={scrollRef}
          minWidth={180}
          aria-label='User Mention results'
        >
          {renderContent()}
        </MenuContent>
      </Menu>
    </>
  )
}
