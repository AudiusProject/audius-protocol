import { useEffect, useRef } from 'react'

import { SearchCategory, useGetSearchResults } from '@audius/common/api'
import { SquareSizes, Status, UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  Avatar,
  Box,
  Flex,
  LoadingSpinner,
  Paper,
  Popup,
  Text
} from '@audius/harmony'
import { useTheme } from '@emotion/react'
import { useSelector } from 'react-redux'

import UserBadges from 'components/user-badges/UserBadges'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

const { getAccountStatus, getUserId } = accountSelectors

const messages = {
  searchUsers: 'Search User',
  noResults: 'No Results'
}

type AutocompleteItemProps = {
  user: UserMetadata
  onConfirm?: (user: UserMetadata) => void
}

const AutocompleteItem = ({ user, onConfirm }: AutocompleteItemProps) => {
  const imageSrc = useProfilePicture(user.user_id, SquareSizes.SIZE_150_BY_150)
  const { color, iconSizes } = useTheme()

  return (
    <Flex
      as='li'
      alignItems='center'
      p='s'
      gap='s'
      borderRadius='s'
      css={{
        ':hover': {
          backgroundColor: color.focus.default,
          cursor: 'pointer',
          '*': { color: color.static.white }
        }
      }}
      onClick={() => onConfirm?.(user)}
    >
      <Box flex={32}>
        <Avatar src={imageSrc} w={32} h={32} borderWidth='thin' />
      </Box>
      <Flex direction='column' alignItems='flex-start' w='100%'>
        <Flex alignItems='center' gap='xs'>
          <Text variant='body' size='s' color='default'>
            {user.name}
          </Text>
          <UserBadges userId={user.user_id} badgeSize={iconSizes['2xs']} />
        </Flex>
        <Text variant='body' size='xs' color='subdued'>
          {user.handle}
        </Text>
      </Flex>
    </Flex>
  )
}

type AutocompleteTextProps = {
  text: string
  onConfirm?: (user: UserMetadata) => void
  onResultsLoaded?: (results: UserMetadata[]) => void
}

export const AutocompleteText = ({
  onConfirm,
  onResultsLoaded,
  text
}: AutocompleteTextProps) => {
  const popupAnchorRef = useRef(null)
  const searchText = text.slice(1)
  const accountStatus = useSelector(getAccountStatus)
  const currentUserId = useSelector(getUserId)
  const { color } = useTheme()

  const params = {
    query: searchText,
    category: 'users' as SearchCategory,
    currentUserId,
    limit: 6,
    offset: 0
  }

  const { data, status } = useGetSearchResults(params, {
    debounce: 500,
    disabled: accountStatus === Status.LOADING || accountStatus === Status.IDLE
  })

  useEffect(() => {
    if (status === Status.SUCCESS && data?.users) {
      onResultsLoaded?.(data.users)
    }
  }, [data, onResultsLoaded, status])

  const results = !searchText ? (
    <Text>{messages.searchUsers}</Text>
  ) : status === Status.LOADING || status === Status.IDLE ? (
    <Flex justifyContent='center' alignItems='center' p='m' w='100%'>
      <LoadingSpinner css={{ height: 32 }} />
    </Flex>
  ) : !data ? (
    <Text>{messages.noResults}</Text>
  ) : (
    <Flex
      as='ul'
      direction='column'
      w='100%'
      css={{
        ':not(:hover) > *:first-child': {
          backgroundColor: color.focus.default,
          '*': { color: color.static.white }
        }
      }}
    >
      {data.users.map((user) => (
        <AutocompleteItem
          key={user.user_id}
          user={user}
          onConfirm={onConfirm}
        />
      ))}
    </Flex>
  )

  return (
    <Box ref={popupAnchorRef} css={{ display: 'inline' }}>
      <Popup
        isVisible
        anchorRef={popupAnchorRef}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Paper css={{ pointerEvents: 'auto', minWidth: 180 }} p='s'>
          {results}
        </Paper>
      </Popup>
      <Text
        css={{
          whiteSpace: 'pre-wrap',
          pointerEvents: 'none'
        }}
        color={'accent'}
      >
        {text}
      </Text>
    </Box>
  )
}
