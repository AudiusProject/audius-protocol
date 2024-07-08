import { useCallback } from 'react'

import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { useNavigation } from 'app/hooks/useNavigation'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

type EditProfileButtonProps = Partial<ButtonProps>

export const EditProfileButton = (props: EditProfileButtonProps) => {
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePress = useCallback(() => {
    navigation.push('EditProfile')
  }, [navigation])

  return (
    <OnlineOnly>
      <Button
        title='Edit Profile'
        variant='primaryAlt'
        onPress={handlePress}
        size='small'
        {...props}
      />
    </OnlineOnly>
  )
}
