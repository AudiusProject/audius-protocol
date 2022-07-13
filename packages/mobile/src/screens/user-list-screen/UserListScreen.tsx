import { ComponentType, ReactElement, ReactNode, useCallback } from 'react'

import { FeatureFlags } from 'audius-client/src/common/services/remote-config'
import { SvgProps } from 'react-native-svg'

import { Screen } from 'app/components/core'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import { UserListTitle } from './UserListTitle'

type UserListScreenProps = {
  title: ReactNode
  titleIcon?: ComponentType<SvgProps>
  children: ReactElement
}

export const UserListScreen = (props: UserListScreenProps) => {
  const { title, titleIcon, children } = props
  const { isEnabled: isTippingEnabled } = useFeatureFlag(
    FeatureFlags.TIPPING_ENABLED
  )

  const headerTitle = useCallback(() => {
    if (!titleIcon) {
      return null
    }
    return <UserListTitle icon={titleIcon} title={title} />
  }, [titleIcon, title])

  return (
    <Screen
      variant='white'
      title={isTippingEnabled ? undefined : title}
      headerTitle={isTippingEnabled ? headerTitle : undefined}>
      {children}
    </Screen>
  )
}
