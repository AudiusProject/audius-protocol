import { useCallback } from 'react'

import type { UserMetadata } from '@audius/common'
import {
  accountSelectors,
  SquareSizes,
  WidthSizes,
  profilePageActions
} from '@audius/common'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { FormTextInput, FormImageInput } from 'app/components/core'
import { FormScreen } from 'app/components/form-screen'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles'

import type { ProfileValues, UpdatedProfile } from './types'

const { getAccountUser } = accountSelectors
const { updateProfile } = profilePageActions

const useStyles = makeStyles(({ palette }) => ({
  coverPhoto: {
    height: 96,
    width: '100%',
    borderRadius: 0
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    height: 100,
    width: 100,
    borderRadius: 100 / 2,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    backgroundColor: palette.neutralLight4,
    zIndex: 100,
    overflow: 'hidden'
  },
  profilePictureImageContainer: {
    height: 'auto',
    width: 'auto'
  },
  profilePictureImage: {
    width: 'auto'
  }
}))

const EditProfileForm = (props: FormikProps<ProfileValues>) => {
  const { handleSubmit, handleReset } = props
  const styles = useStyles()

  return (
    <FormScreen
      variant='secondary'
      onReset={handleReset}
      onSubmit={handleSubmit}
      goBackOnSubmit
    >
      <FormImageInput
        name='cover_photo'
        styles={{ imageContainer: styles.coverPhoto }}
      />
      <FormImageInput
        name='profile_picture'
        styles={{
          root: styles.profilePicture,
          imageContainer: styles.profilePictureImageContainer,
          image: styles.profilePictureImage
        }}
      />
      <View style={{ paddingTop: 64 }}>
        <FormTextInput isFirstInput name='name' label='Name' />
        <FormTextInput name='bio' label='Bio' multiline maxLength={256} />
        <FormTextInput name='location' label='Location' />
        <FormTextInput
          name='twitter_handle'
          label='Twitter Handle'
          prefix='@'
          icon={IconTwitterBird}
        />
        <FormTextInput
          name='instagram_handle'
          label='Instagram Handle'
          prefix='@'
          icon={IconInstagram}
        />
        <FormTextInput
          name='tiktok_handle'
          label='TikTok Handle'
          prefix='@'
          icon={IconTikTokInverted}
        />
        <FormTextInput name='website' label='Website' icon={IconLink} />
        <FormTextInput name='donation' label='Donation' icon={IconDonate} />
      </View>
    </FormScreen>
  )
}

export const EditProfileScreen = () => {
  const profile = useSelector(getAccountUser)

  const dispatch = useDispatch()

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
        newProfile.updatedProfilePicture = profile_picture
      }
      dispatch(updateProfile(newProfile as UserMetadata))
    },
    [dispatch, profile]
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
