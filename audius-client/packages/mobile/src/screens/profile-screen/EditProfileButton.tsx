import { useCallback } from 'react'

import { Button, ButtonProps } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

type EditProfileButtonProps = Partial<ButtonProps>

export const EditProfileButton = (props: EditProfileButtonProps) => {
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePress = useCallback(() => {
    // goBack does not trigger web pop in BaseStackNavigator
    navigation.push({
      native: { screen: 'EditProfile', params: undefined }
    })
  }, [navigation])

  return (
    <Button
      title='Edit Profile'
      variant='secondary'
      onPress={handlePress}
      size='small'
      {...props}
    />
  )
}
