import type { ComponentType, ReactElement, ReactNode } from 'react'
import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common'
import type { SvgProps } from 'react-native-svg'

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
      headerTitle={isTippingEnabled ? headerTitle : undefined}
      topbarRight={null}>
      {children}
    </Screen>
  )
}
