import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

import {
  SearchCategory,
  useGetSearchResults,
  useFollowers
} from '@audius/common/api'
import { Status, UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  Flex,
  LoadingSpinner,
  MenuContent,
  Menu,
  MenuItem,
  Text,
  OptionKeyHandler
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { Avatar } from 'components/avatar'
import { UserLink } from 'components/link'

const { getAccountStatus, getUserId } = accountSelectors

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
  const accountStatus = useSelector(getAccountStatus)
  const currentUserId = useSelector(getUserId)
  const {
    data: followersData,
    isPending: followerDataPending,
    isSuccess: followersDataSuccess
  } = useFollowers({
    userId: currentUserId,
    pageSize: 6
  })
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

  const { data: searchUserData, status: searchStatus } = useGetSearchResults(
    params,
    {
      debounce: 500,
      disabled:
        accountStatus === Status.LOADING || accountStatus === Status.IDLE
    }
  )

  const userList = searchText !== '' ? searchUserData?.users : followersData
  const userListLoadSuccess =
    searchText !== '' ? searchStatus === Status.SUCCESS : followersDataSuccess
  const isUserListPending =
    searchText !== ''
      ? searchStatus === Status.LOADING || searchStatus === Status.IDLE
      : followerDataPending

  const options = useMemo(
    () => userList?.map((user) => ({ value: String(user.user_id) })) ?? [],
    [userList]
  )

  useEffect(() => {
    if (userList && userListLoadSuccess) {
      onResultsLoaded?.(userList)
    }
  }, [
    userList,
    onResultsLoaded,
    searchText,
    followersData,
    userListLoadSuccess
  ])

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
                    <Text
                      size='xs'
                      color={isActive ? 'staticWhite' : 'subdued'}
                    >
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
