import type { ComponentType, ReactElement, ReactNode } from 'react'
import { useCallback } from 'react'

import type { SvgProps } from 'react-native-svg'

import { Screen } from 'app/components/core'

import { UserListTitle } from './UserListTitle'

type UserListScreenProps = {
  title: ReactNode
  titleIcon?: ComponentType<SvgProps>
  children: ReactElement
}

export const UserListScreen = (props: UserListScreenProps) => {
  const { title, titleIcon, children } = props

  const headerTitle = useCallback(() => {
    if (!titleIcon) {
      return null
    }
    return <UserListTitle icon={titleIcon} title={title} />
  }, [titleIcon, title])

  return (
    <Screen variant='white' headerTitle={headerTitle} topbarRight={null}>
      {children}
    </Screen>
  )
}
