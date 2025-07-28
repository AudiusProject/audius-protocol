import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { IconTrophy, Text } from '@audius/harmony-native'
import { coinLeaderboardUserListActions, coinLeaderboardUserListSelectors } from '@audius/common/store'
import { useArtistCoinMembers } from '@audius/common/api'

import { UserListScreen } from './UserListScreen'
import { UserList } from './UserList'
import { useRoute } from 'app/hooks/useRoute'

const messages = {
  title: 'BONK Leaderboard'
}

export const CoinLeaderboardScreen = () => {
  const dispatch = useDispatch()
  const { params } = useRoute<'CoinLeaderboard'>()
  const { mint } = params
  const reduxMint = useSelector(coinLeaderboardUserListSelectors.getMint)

  const { data, isFetchingNextPage, fetchNextPage, isPending } =
    useArtistCoinMembers({ mint: reduxMint || mint })

  useEffect(() => {
    if (mint) {
      dispatch(coinLeaderboardUserListActions.setCoinLeaderboard(mint))
    }
    
    return () => {
      // Clean up when component unmounts
      dispatch(coinLeaderboardUserListActions.setCoinLeaderboard(null))
    }
  }, [dispatch, mint])

  if (!mint && !reduxMint) return null

  return (
    <UserListScreen title={messages.title} titleIcon={IconTrophy}>
      <UserList
        data={data?.map((member) => member.user_id)}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='COIN_LEADERBOARD'
        showRank={true}
        renderRightContent={(userId) => {
          const member = data?.find(m => m.user_id === userId)
          return member ? (
            <Text size='s' strength='strong'>
              {member.balance.toLocaleString()}
            </Text>
          ) : null
        }}
      />
    </UserListScreen>
  )
} 