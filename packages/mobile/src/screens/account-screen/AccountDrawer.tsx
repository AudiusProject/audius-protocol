import { useCallback } from 'react'

import { accountSelectors } from '@audius/common'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'

import { useAppDrawerNavigation } from '../app-drawer-screen'
const { getAccountUser } = accountSelectors

type AccountDrawerProps = DrawerContentComponentProps

export const AccountDrawer = (props: AccountDrawerProps) => {
  const accountUser = useSelector(getAccountUser)
  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    navigation.navigate('Profile', { handle: 'accountUser' })
  }, [navigation])

  return (
    <DrawerContentScrollView {...props}>
      <Text onPress={handlePressAccount}>{accountUser?.name}</Text>
    </DrawerContentScrollView>
  )
}
