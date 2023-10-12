import { useCallback, useContext, useMemo } from 'react'

import type { User, BNWei } from '@audius/common'
import {
  formatWei,
  walletSelectors,
  accountSelectors,
  useSelectTierInfo,
  isNullOrUndefined
} from '@audius/common'
import BN from 'bn.js'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconAudioBadge } from 'app/components/audio-rewards'
import { Text } from 'app/components/core'
import { Skeleton } from 'app/components/skeleton'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingLeft: spacing(4),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  accountImage: {
    height: spacing(12.5),
    width: spacing(12.5),
    marginBottom: spacing(3),
    borderWidth: 1
  },
  accountName: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingRight: spacing(2)
  },
  name: {
    flexShrink: 1
  },
  accountBadges: {
    flexGrow: 1,
    alignSelf: 'center'
  },
  handle: {
    paddingRight: spacing(3)
  },
  tokens: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: spacing(4)
  },
  tokenBadge: {
    marginRight: spacing(1)
  }
}))

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
const useTotalBalanceWithFallback = () => {
  const account = useSelector(getAccountUser)
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (!isNullOrUndefined(walletTotalBalance)) {
      return walletTotalBalance
    } else if (!isNullOrUndefined(account?.total_balance)) {
      return new BN(account.total_balance) as BNWei
    }

    return null
  }, [account, walletTotalBalance])
}

export const AccountDetails = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser) as User
  const { user_id, name, handle } = accountUser
  const { tier } = useSelectTierInfo(user_id)
  const totalBalance = useTotalBalanceWithFallback()

  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    navigation.push('Profile', { handle: 'accountUser' })
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

  const handlePressRewards = useCallback(() => {
    navigation.push('AudioScreen')
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

  return (
    <View style={styles.root}>
      <TouchableOpacity onPress={handlePressAccount}>
        <ProfilePicture profile={accountUser} style={styles.accountImage} />
        <View style={styles.accountName}>
          <Text numberOfLines={1} style={styles.name} variant='h1' noGutter>
            {name}
          </Text>
          <UserBadges
            user={accountUser}
            hideName
            style={styles.accountBadges}
          />
        </View>
        <Text
          style={styles.handle}
          numberOfLines={1}
          weight='medium'
          fontSize='medium'
        >
          @{handle}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tokens} onPress={handlePressRewards}>
        <IconAudioBadge
          tier={tier}
          showNoTier
          style={styles.tokenBadge}
          height={spacing(7)}
          width={spacing(7)}
        />
        {isNullOrUndefined(totalBalance) ? (
          <Skeleton height={18} width={25} />
        ) : (
          <Text fontSize='large' weight='heavy'>
            {formatWei(totalBalance, true, 0)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
