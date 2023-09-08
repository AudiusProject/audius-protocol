import type { ComponentType, ReactElement, ReactNode } from 'react'

import type { SvgProps } from 'react-native-svg'

import { Screen, ScreenContent } from 'app/components/core'

type UserListScreenProps = {
  title: ReactNode
  titleIcon?: ComponentType<SvgProps>
  children: ReactElement
}

export const UserListScreen = (props: UserListScreenProps) => {
  const { title, titleIcon, children } = props

  return (
    <Screen variant='white' title={title} icon={titleIcon}>
      <ScreenContent>{children}</ScreenContent>
    </Screen>
  )
}
