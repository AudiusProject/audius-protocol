import { useCallback } from 'react'

import { Button, ButtonProps } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

type EditProfileButtonProps = Partial<ButtonProps>

export const EditProfileButton = (props: EditProfileButtonProps) => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate({
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
