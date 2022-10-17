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
  const { isEnabled: isNavOverhaulEnabled } = useFeatureFlag(
    FeatureFlags.MOBILE_NAV_OVERHAUL
  )

  const headerTitle = useCallback(() => {
    return <UserListTitle icon={titleIcon} title={title} />
  }, [titleIcon, title])

  if (isNavOverhaulEnabled) {
    return (
      <Screen variant='white' title={title} icon={titleIcon}>
        {children}
      </Screen>
    )
  }
  return (
    <Screen variant='white' headerTitle={headerTitle} topbarRight={null}>
      {children}
    </Screen>
  )
}
