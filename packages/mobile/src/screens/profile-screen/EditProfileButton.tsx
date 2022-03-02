import { useCallback } from 'react'

import { ProfileStackParamList } from 'app/components/app-navigator/types'
import { Button, ButtonProps } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

type EditProfileButtonProps = Partial<ButtonProps>

export const EditProfileButton = (props: EditProfileButtonProps) => {
  const navigation = useNavigation<ProfileStackParamList>()

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
