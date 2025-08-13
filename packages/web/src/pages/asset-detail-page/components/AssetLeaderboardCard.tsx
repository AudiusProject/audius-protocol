import { useArtistCoinMembers, useUsers } from '@audius/common/api'
import { Flex, Paper, Text, Divider, Skeleton } from '@audius/harmony'

import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'

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

  const isPending = isLeaderboardPending || isUsersPending

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
      <Flex pv='l' ph='xl'>
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
      </Flex>
    </Paper>
  )
}
