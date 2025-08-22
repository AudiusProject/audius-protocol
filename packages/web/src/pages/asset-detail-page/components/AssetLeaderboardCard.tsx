import {
  useArtistCoinInsights,
  useArtistCoinMembers,
  useUsers
} from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import {
  Flex,
  Paper,
  Text,
  Divider,
  Skeleton,
  IconCaretRight,
  IconButton,
  useMedia
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { UserProfilePictureList } from 'components/user-profile-picture-list'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

const messages = coinDetailsMessages.coinLeaderboard

const AvatarSkeleton = (props: any) => (
  <Skeleton
    h={40}
    w={40}
    borderRadius='circle'
    css={{ marginLeft: '-8px' }}
    {...props}
  />
)

type AssetLeaderboardCardProps = {
  mint: string
}

export const AssetLeaderboardCard = ({ mint }: AssetLeaderboardCardProps) => {
  const { isMedium: isSmallScreen } = useMedia() // <1024px
  const numUsersShowing = isSmallScreen ? 6 : 8
  const { data: leaderboardUsers, isPending: isLeaderboardPending } =
    useArtistCoinMembers(
      { mint },
      {
        select: (data) => {
          return data.pages.flat().slice(0, numUsersShowing)
        }
      }
    )
  const { data: users, isPending: isUsersPending } = useUsers(
    leaderboardUsers?.map((user) => user.userId)
  )
  const coinInsights = useArtistCoinInsights({ mint })
  const dispatch = useDispatch()
  const isPending = isLeaderboardPending || isUsersPending

  const handleViewLeaderboard = () => {
    dispatch(
      setUsers({
        userListType: UserListType.COIN_LEADERBOARD,
        entityType: UserListEntityType.USER,
        entity: mint
      })
    )
    dispatch(setVisibility(true))
  }

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      direction='column'
      alignItems='flex-start'
    >
      <Flex alignItems='center' gap='xs' pv='l' ph='xl'>
        <Text variant='heading' size='s' color='heading'>
          {messages.title}
        </Text>
      </Flex>
      <Divider css={{ width: '100%' }} />
      <Flex
        pv='l'
        ph='xl'
        justifyContent='space-between'
        alignItems='center'
        w='100%'
      >
        {isPending ? (
          <Flex alignItems='center'>
            <AvatarSkeleton css={{ marginLeft: '0' }} />
            <AvatarSkeleton />
            <AvatarSkeleton />
            <AvatarSkeleton />
            <AvatarSkeleton />
            <AvatarSkeleton />
            <AvatarSkeleton />
            <AvatarSkeleton />
          </Flex>
        ) : (
          <Flex
            onClick={(e) => {
              handleViewLeaderboard()
            }}
            css={{ cursor: 'pointer' }}
            role='button'
          >
            <UserProfilePictureList
              users={users ?? []}
              totalUserCount={coinInsights?.data?.members}
              limit={isSmallScreen ? 6 : 8}
              disableProfileClick={true}
              disablePopover={true}
            />
          </Flex>
        )}
        <IconButton
          color='subdued'
          icon={IconCaretRight}
          aria-label='Open the leaderboard modal'
          onClick={handleViewLeaderboard}
          disabled={isPending}
        />
      </Flex>
    </Paper>
  )
}
