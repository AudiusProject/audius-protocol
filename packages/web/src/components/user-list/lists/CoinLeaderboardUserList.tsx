import { useArtistCoinMembers } from '@audius/common/api'
import { coinLeaderboardUserListSelectors } from '@audius/common/store'
import { Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const CoinLeaderboardUserList = () => {
  const mint = useSelector(coinLeaderboardUserListSelectors.getMint)

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useArtistCoinMembers({ mint })

  if (!mint) return null

  return (
    <UserList
      data={data?.map((member) => ({
        userId: member.user_id,
        balance: member.balance
      }))}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
      showRank={true}
      renderRightContent={(item, index) => {
        return typeof item === 'object' && item.balance !== undefined ? (
          <Text variant='body' strength='strong'>
            {item.balance.toLocaleString()}
          </Text>
        ) : null
      }}
    />
  )
}
