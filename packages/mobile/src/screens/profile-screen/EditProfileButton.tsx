import { useCallback } from 'react'

import type { ButtonProps } from '@audius/harmony-native'
import { Button, IconPencil } from '@audius/harmony-native'
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
        variant='secondary'
        onPress={handlePress}
        size='small'
        iconLeft={IconPencil}
        {...props}
      >
        Edit Profile
      </Button>
    </OnlineOnly>
  )
}
