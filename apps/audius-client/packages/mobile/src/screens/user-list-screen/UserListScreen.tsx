import { ReactElement, useEffect } from 'react'

import { useNavigation } from '@react-navigation/native'

type UserListScreenProps = {
  title: string
  children: ReactElement
}

export const UserListScreen = (props: UserListScreenProps) => {
  const { title, children } = props
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      title
    })
  }, [navigation, title])

  return children
}
