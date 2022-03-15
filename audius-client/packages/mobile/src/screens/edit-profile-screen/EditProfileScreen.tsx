import { useCallback } from 'react'

import { useNavigation } from '@react-navigation/native'
import {
  SquareSizes,
  WidthSizes
} from 'audius-client/src/common/models/ImageSizes'
import { UserMetadata } from 'audius-client/src/common/models/User'
import { updateProfile } from 'audius-client/src/common/store/pages/profile/actions'
import { Formik, FormikProps } from 'formik'
import { View } from 'react-native'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { Screen, TextButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'

import { getProfile } from '../profile-screen/selectors'

import { CoverPhotoInput } from './CoverPhotoInput'
import { ProfilePictureInput } from './ProfilePictureInput'
import { ProfileTextInput } from './ProfileTextInput'
import { ProfileValues, UpdatedProfile } from './types'

const messages = {
  save: 'Save',
  cancel: 'Cancel'
}

const EditProfileForm = (props: FormikProps<ProfileValues>) => {
  const { handleSubmit, handleReset } = props
  const navigation = useNavigation()

  return (
    <Screen
      variant='secondary'
      topbarLeft={
        <TextButton
          title={messages.cancel}
          variant='secondary'
          onPress={() => {
            navigation.goBack()
            handleReset()
          }}
        />
      }
      topbarRight={
        <TextButton
          title={messages.save}
          variant='primary'
          onPress={() => {
            handleSubmit()
            navigation.goBack()
          }}
        />
      }
    >
      <CoverPhotoInput />
      <ProfilePictureInput />
      <View style={{ paddingTop: 64 }}>
        <ProfileTextInput isFirstInput name='name' label='Name' />
        <ProfileTextInput name='bio' label='Bio' multiline maxLength={256} />
        <ProfileTextInput name='location' label='Location' />
        <ProfileTextInput
          name='twitter_handle'
          label='Twitter Handle'
          isHandle
          icon={IconTwitterBird}
        />
        <ProfileTextInput
          name='instagram_handle'
          label='Instagram Handle'
          isHandle
          icon={IconInstagram}
        />
        <ProfileTextInput
          name='tiktok_handle'
          label='TikTok Handle'
          isHandle
          icon={IconTikTokInverted}
        />
        <ProfileTextInput name='website' label='Website' icon={IconLink} />
        <ProfileTextInput name='donation' label='Donation' icon={IconDonate} />
      </View>
    </Screen>
  )
}

export const EditProfileScreen = () => {
  const { profile } = useSelectorWeb(getProfile)
  const dispatchWeb = useDispatchWeb()

  const coverPhoto = useUserCoverPhoto({
    id: profile?.user_id ?? null,
    sizes: profile?._cover_photo_sizes ?? null,
    size: WidthSizes.SIZE_2000
  })

  const profilePicture = useUserProfilePicture({
    id: profile?.user_id ?? null,
    sizes: profile?._profile_picture_sizes ?? null,
    size: SquareSizes.SIZE_150_BY_150
  })

  const handleSubmit = useCallback(
    (values: ProfileValues) => {
      if (!profile) return
      const { cover_photo, profile_picture, ...restValues } = values

      // @ts-ignore typing is hard here, will come back
      const newProfile: UpdatedProfile = {
        ...profile,
        ...restValues
      }
      if (cover_photo.file) {
        newProfile.updatedCoverPhoto = cover_photo
      }

      if (profile_picture.file) {
        newProfile.updatedProfilePicture = cover_photo
      }
      dispatchWeb(updateProfile(newProfile as UserMetadata))
    },
    [dispatchWeb, profile]
  )

  if (!profile) return null

  // these values are actually Nullable<string>, but types think they are
  // string | undefined. For now, explicitly casting to null
  const {
    name,
    bio,
    location,
    twitter_handle = null,
    instagram_handle = null,
    tiktok_handle = null,
    website = null,
    donation = null
  } = profile

  const initialValues = {
    name,
    bio,
    location,
    twitter_handle,
    instagram_handle,
    tiktok_handle,
    website,
    donation,
    cover_photo: { url: coverPhoto },
    profile_picture: { url: profilePicture }
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={EditProfileForm}
    />
  )
}
