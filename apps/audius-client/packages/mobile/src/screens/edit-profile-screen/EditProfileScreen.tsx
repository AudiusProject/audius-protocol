import { useEffect } from 'react'

import { useNavigation } from '@react-navigation/native'
import {
  SquareSizes,
  WidthSizes
} from 'audius-client/src/common/models/ImageSizes'
import { Formik, FormikProps } from 'formik'
import { Dimensions, View } from 'react-native'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { TextButton } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles'

import { getProfile } from '../profile-screen/selectors'

import { CoverPhotoInput } from './CoverPhotoInput'
import { ProfilePictureInput } from './ProfilePictureInput'
import { ProfileTextInput } from './ProfileTextInput'
import { ProfileValues } from './types'

const messages = {
  save: 'Save',
  cancel: 'Cancel'
}

const screenHeight = Dimensions.get('window').height

const useStyles = makeStyles(({ palette }) => ({
  screen: {
    height: screenHeight,
    backgroundColor: palette.white
  }
}))

const EditProfileForm = (props: FormikProps<ProfileValues>) => {
  const { handleSubmit, handleReset } = props
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TextButton
          title={messages.cancel}
          variant='secondary'
          onPress={() => {
            navigation.goBack()
            handleReset()
          }}
        />
      ),
      headerRight: () => (
        <TextButton
          title={messages.save}
          variant='primary'
          onPress={() => {
            handleSubmit()
            navigation.goBack()
          }}
        />
      )
    })
  }, [handleReset, handleSubmit, navigation])

  return (
    <View>
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
    </View>
  )
}

export const EditProfileScreen = () => {
  const { profile } = useSelectorWeb(getProfile)
  const styles = useStyles()

  const coverPhoto = useUserCoverPhoto(
    profile?.user_id ?? null,
    profile?._cover_photo_sizes ?? null,
    WidthSizes.SIZE_2000
  )

  const profilePicture = useUserProfilePicture(
    profile?.user_id ?? null,
    profile?._profile_picture_sizes ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  if (!profile) return null

  const {
    name,
    bio,
    location,
    twitter_handle,
    instagram_handle,
    tiktok_handle,
    website,
    donation
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
    cover_photo: { uri: coverPhoto },
    profile_picture: { uri: profilePicture }
  }

  return (
    <View style={styles.screen}>
      <Formik
        initialValues={initialValues}
        onSubmit={values => console.log(values)}
        component={EditProfileForm}
      />
    </View>
  )
}
