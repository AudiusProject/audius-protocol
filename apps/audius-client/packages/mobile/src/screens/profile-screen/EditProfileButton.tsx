import { useCallback } from 'react'

import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

export const EditProfileButton = () => {
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
    />
  )
}
