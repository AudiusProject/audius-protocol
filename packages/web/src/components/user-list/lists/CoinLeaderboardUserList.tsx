import { useArtistCoin, useArtistCoinMembers } from '@audius/common/api'
import { coinLeaderboardUserListSelectors } from '@audius/common/store'
import { Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const CoinLeaderboardUserList = () => {
  const mint = useSelector(coinLeaderboardUserListSelectors.getMint)

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useArtistCoinMembers({ mint: mint || '' })

  const { data: coinData } = useArtistCoin({ mint: mint || '' })
  const { decimals } = coinData ?? {}

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
            {decimals
              ? Math.floor(
                  item.balance / Math.pow(10, decimals)
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })
              : item.balance.toLocaleString()}
          </Text>
        ) : null
      }}
    />
  )
}
