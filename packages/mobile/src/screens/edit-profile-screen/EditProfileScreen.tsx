import { useCallback, useEffect } from 'react'

import type { UserMetadata } from '@audius/common'
import {
  accountSelectors,
  profilePageActions,
  profilePageSelectors,
  Status
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
import { useUserCoverImage } from 'app/components/image/UserCoverImage'
import { useUserImage } from 'app/components/image/UserImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileValues, UpdatedProfile } from './types'

const { getAccountUser, getUserHandle } = accountSelectors
const { updateProfile } = profilePageActions
const { getProfileEditStatus } = profilePageSelectors

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
  const accountHandle = useSelector(getUserHandle)
  const navigation = useNavigation()
  const editStatus = useSelector((state) =>
    getProfileEditStatus(state, accountHandle!)
  )
  useEffect(() => {
    // Ensure we kick off the edit action before returning to profile screen
    if (editStatus === Status.LOADING) {
      navigation.goBack()
    }
  }, [editStatus, navigation])

  return (
    <FormScreen variant='white' onReset={handleReset} onSubmit={handleSubmit}>
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

  const { source: coverPhotoSource } = useUserCoverImage(profile)

  const { source: imageSource } = useUserImage(profile)

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
    cover_photo: { url: coverPhotoSource[0].uri },
    profile_picture: { url: imageSource[0].uri }
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={EditProfileForm}
    />
  )
}
