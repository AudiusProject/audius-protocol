import { useArtistCoinMembers, useUsers } from '@audius/common/api'
import {
  Flex,
  Paper,
  Text,
  Divider,
  Skeleton,
  IconCaretRight,
  IconButton
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { AssetDetailProps } from '../types'

const messages = {
  title: 'Members Leaderboard',
  leaderboard: 'Leaderboard'
}

export const AssetLeaderboardCard = ({ mint }: AssetDetailProps) => {
  const { data: leaderboardUsers, isPending: isLeaderboardPending } =
    useArtistCoinMembers({ mint })
  const { data: users, isPending: isUsersPending } = useUsers(
    leaderboardUsers?.map((user) => user.user_id)
  )
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
          <Skeleton />
        ) : (
          <UserProfilePictureList
            users={users ?? []}
            totalUserCount={leaderboardUsers?.length ?? 0}
            limit={10}
            disableProfileClick={true}
            disablePopover={true}
            stopPropagation={true}
          />
        )}
        <IconButton
          color='subdued'
          icon={IconCaretRight}
          aria-label='Open the leaderboard modal'
          onClick={handleViewLeaderboard}
        />
      </Flex>
    </Paper>
  )
}
